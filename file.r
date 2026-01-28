use std::collections::HashMap;

fn main() {
    // Count word frequencies in a sentence (case-insensitive, punctuation stripped)
    let text = "Rust is fast, Rust is safe, and Rust is fun!";
    let mut counts: HashMap<String, usize> = HashMap::new();

    for raw in text
        .split_whitespace()
        .map(|w| w.trim_matches(|c: char| !c.is_alphanumeric()).to_lowercase())
        .filter(|w| !w.is_empty())
    {
        *counts.entry(raw).or_insert(0) += 1;
    }

    // Print in descending frequency
    let mut items: Vec<_> = counts.into_iter().collect();
    items.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));

    for (word, n) in items {
        println!("{word}: {n}");
    }
}
