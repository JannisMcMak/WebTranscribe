use wasm_bindgen::prelude::*;

mod timestretch;

#[wasm_bindgen]
pub fn timestretch(input: Vec<f32>, sample_rate: f64, speed_ratio: f64) -> Vec<f32> {
    return timestretch::Wsola::new(sample_rate, speed_ratio).process(input);
}
