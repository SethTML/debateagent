use axum::{routing::post, Router, Json, http::StatusCode};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::env;
use tower_http::cors::{CorsLayer, Any};
use async_openai::{
    types::{
        ChatCompletionRequestSystemMessageArgs, 
        ChatCompletionRequestUserMessageArgs, 
        ChatCompletionRequestAssistantMessageArgs,
        CreateChatCompletionRequestArgs,
        ChatCompletionRequestMessage
    },
    Client,
};
use dotenvy::dotenv;

#[derive(Deserialize, Serialize, Debug)]
struct ChatMessage {
    role: String,    
    content: String,
}

#[derive(Deserialize, Debug)]
struct DebateRequest {
    messages: Vec<ChatMessage>, 
}

#[derive(Serialize)]
struct DebateResponse {
    reply: String,
}

async fn debate_handler(
    payload: Result<Json<DebateRequest>, axum::extract::rejection::JsonRejection>,
) -> Result<Json<DebateResponse>, (StatusCode, String)> {
    
    // This part catches JSON mismatches and prints them to your terminal
    let Json(payload) = payload.map_err(|e| {
        println!("❌ JSON Error: {}", e.body_text());
        (StatusCode::BAD_REQUEST, format!("Invalid JSON: {}", e.body_text()))
    })?;

    println!("✅ Received {} messages from frontend", payload.messages.len());

    let client = Client::new();

    let mut openai_messages: Vec<ChatCompletionRequestMessage> = vec![
        ChatCompletionRequestSystemMessageArgs::default()
            .content("You are a helpful debate assistant.")
            .build().unwrap().into(),
    ];

    for msg in payload.messages {
        let converted: ChatCompletionRequestMessage = if msg.role == "user" {
            ChatCompletionRequestUserMessageArgs::default().content(msg.content).build().unwrap().into()
        } else {
            ChatCompletionRequestAssistantMessageArgs::default().content(msg.content).build().unwrap().into()
        };
        openai_messages.push(converted);
    }

    let request = CreateChatCompletionRequestArgs::default()
        .model("gpt-4o-mini") 
        .messages(openai_messages)
        .build()
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let response = client.chat().create(request).await.map_err(|e| {
        println!("❌ OpenAI Error: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
    })?;

    let reply = response.choices.first()
        .and_then(|choice| choice.message.content.clone())
        .unwrap_or_else(|| "No response".to_string());

    Ok(Json(DebateResponse { reply }))
}

#[tokio::main]
async fn main() {
    dotenv().ok();
    
    match env::var("OPENAI_API_KEY") {
        Ok(_) => println!("🚀 API Key found!"),
        Err(_) => println!("⚠️ API Key MISSING from .env!"),
    }

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/debate", post(debate_handler))
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    println!("Server listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}