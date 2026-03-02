use axum::{routing::post, Router, Json, http::StatusCode};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::env;
use std::sync::Arc;
use tower_http::cors::{CorsLayer, Any};
use async_openai::{
    types::{
        ChatCompletionRequestSystemMessageArgs, 
        CreateChatCompletionRequestArgs,
    },
    Client as OpenAiClient, 
};
use dotenvy::dotenv;

use tower_governor::{governor::GovernorConfigBuilder, GovernorLayer};

#[derive(Deserialize, Debug)]
struct DebateRequest {
    topic: String, 
}

#[derive(Serialize)]
struct DebateMessage {
    role: String,
    content: String,
}

#[derive(Serialize)]
struct DebateResponse {
    history: Vec<DebateMessage>,
}

async fn debate_handler(
    payload: Result<Json<DebateRequest>, axum::extract::rejection::JsonRejection>,
) -> Result<Json<DebateResponse>, (StatusCode, String)> {
    
    let Json(payload) = payload.map_err(|e| (StatusCode::BAD_REQUEST, e.body_text()))?;
    println!("✅ Arena Topic: {}", payload.topic);

    let gpt_client = OpenAiClient::new(); 
    let reqwest_client = reqwest::Client::new();
    
    let gemini_key = env::var("GEMINI_API_KEY").map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Key Missing".to_string()))?;
    let gemini_url = format!("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={}", gemini_key);

    let mut history: Vec<DebateMessage> = Vec::new();
    let mut last_gpt_argument = String::new();
    let mut last_gemini_argument = String::new();

    for round in 1..=3 {
        println!("🥊 Round {} starting...", round);

        let gpt_prompt = if round == 1 {
            format!("You are a Pro-stance debater. Topic: {}. Make your opening statement. You MUST keep your response strictly to 2 or 3 sentences.", payload.topic)
        } else {
            format!("You are a Pro-stance debater. Topic: {}. Opponent (CON) just argued: '{}'. Rebut their points fiercely. You MUST keep your response strictly to 2 or 3 sentences.", payload.topic, last_gemini_argument)
        };

        let gpt_req = CreateChatCompletionRequestArgs::default()
            .model("gpt-4o-mini")
            .messages([
                ChatCompletionRequestSystemMessageArgs::default().content(gpt_prompt).build().unwrap().into()
            ])
            .build().map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        let gpt_res = gpt_client.chat().create(gpt_req).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        last_gpt_argument = gpt_res.choices[0].message.content.clone().unwrap_or_default();
        
        history.push(DebateMessage { role: "gpt".to_string(), content: last_gpt_argument.clone() });

        let gemini_prompt = format!("You are a Con-stance debater. Topic: {}. Opponent (PRO) just argued: '{}'. Rebut their points fiercely. You MUST keep your response strictly to 2 or 3 sentences.", payload.topic, last_gpt_argument);
        
        let gemini_body = serde_json::json!({
            "contents": [{ "parts": [{ "text": gemini_prompt }] }]
        });

        let gemini_res = reqwest_client.post(&gemini_url)
            .header("Content-Type", "application/json")
            .json(&gemini_body)
            .send().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        let json: serde_json::Value = gemini_res.json().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        if let Some(error) = json.get("error") {
            let error_msg = error.get("message").and_then(|m| m.as_str()).unwrap_or("Unknown Error");
            last_gemini_argument = format!("Gemini Error: {}", error_msg);
        } else {
            last_gemini_argument = json["candidates"][0]["content"]["parts"][0]["text"]
                .as_str()
                .unwrap_or("Gemini generated an empty response.")
                .to_string();
        }

        history.push(DebateMessage { role: "gemini".to_string(), content: last_gemini_argument.clone() });
    }

    Ok(Json(DebateResponse { history }))
}

#[tokio::main]
async fn main() {
    dotenv().ok();
    
    let governor_conf = Arc::new(
        GovernorConfigBuilder::default()
            .per_second(1) 
            .burst_size(2)
            .finish()
            .unwrap()
    );

    let cors = CorsLayer::new().allow_origin(Any).allow_methods(Any).allow_headers(Any);
    
    let app = Router::new()
        .route("/api/debate", post(debate_handler))
        .layer(GovernorLayer { config: governor_conf }) 
        .layer(cors);
    
    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    println!("Arena Server running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    
    axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>()).await.unwrap();
}