use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn foo(input: Vec<f32>) -> usize {
    return input.len();
}
