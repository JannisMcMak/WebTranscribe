pub struct Wsola {
    speed_ratio: f64,
    window_size: usize,
    search_range: usize,
}

impl Wsola {
    pub fn new(sample_rate: f64, speed_ratio: f64) -> Self {
        Self {
            speed_ratio,
            window_size: (0.02 * sample_rate) as usize, // 20ms window
            search_range: (0.01 * sample_rate) as usize, // 10ms search range
        }
    }

    // A simple Absolute Magnitude Difference Function (AMDF) to find similarity
    fn find_best_match(&self, template: &[f32], search_area: &[f32]) -> usize {
        let mut best_offset = 0;
        let mut min_diff = f32::MAX;

        for offset in 0..(search_area.len() - template.len()) {
            let mut diff = 0.0;
            for i in 0..template.len() {
                diff += (template[i] - search_area[offset + i]).abs();
            }
            if diff < min_diff {
                min_diff = diff;
                best_offset = offset;
            }
        }
        best_offset
    }

    pub fn process(&self, input: Vec<f32>) -> Vec<f32> {
        if input.len() < self.window_size + self.search_range {
            return input; // Not enough data to process
        }

        // Output size is roughly Input / Speed
        let expected_size = (input.len() as f64 / self.speed_ratio) as usize + self.window_size;
        let mut output = vec![0.0; expected_size];

        let hop_out = self.window_size / 2; // Fixed output hop (50% overlap)
        let hop_in = (hop_out as f64 * self.speed_ratio) as usize; // Variable input hop

        let mut in_ptr = 0;
        let mut out_ptr = 0;

        // Create Hanning window
        let window: Vec<f32> = (0..self.window_size)
            .map(|i| {
                0.5 * (1.0
                    - (2.0 * std::f32::consts::PI * i as f32 / (self.window_size - 1) as f32).cos())
            })
            .collect();

        // 1. Initialize: Copy the very first window directly to output
        for i in 0..self.window_size {
            output[i] = input[i] * window[i];
        }

        // 2. Main Loop
        while in_ptr + hop_in + self.window_size + self.search_range < input.len() {
            // Target position based purely on the speed ratio
            let target_in_ptr = in_ptr + hop_in;

            // Template: The "tail" of the last window we wrote to the output.
            // We want to find a segment in the input that looks like this tail.
            let template_start = out_ptr + hop_out;
            let template = &output[template_start..template_start + hop_out];

            // Search Area: A small neighborhood around our target input position
            let search_start = target_in_ptr;
            let search_area = &input[search_start..search_start + hop_out + self.search_range];

            // 3. Find the best alignment offset
            let best_offset = self.find_best_match(template, search_area);
            let adjusted_in_ptr = search_start + best_offset;

            // 4. Overlap-Add: Blend the new segment into the output
            for i in 0..self.window_size {
                let out_idx = out_ptr + hop_out + i;
                if out_idx < output.len() {
                    // Blend the new windowed samples into the existing buffer
                    output[out_idx] += input[adjusted_in_ptr + i] * window[i];
                }
            }

            // Advance pointers
            out_ptr += hop_out;
            in_ptr = adjusted_in_ptr;
        }

        // Clean up: Truncate the output to the last written position
        output.truncate(out_ptr + self.window_size);
        output
    }
}
