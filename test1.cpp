#include <iostream>
#include <vector>
#include <string>
#include <random>
#include <algorithm>

// Random "name generator" + shuffle demo
int main() {
    std::vector<std::string> syllables{
        "ka","zu","mi","ra","to","shi","na","lo","vi","zen","qu","bar"
    };

    std::random_device rd;
    std::mt19937 rng(rd());
    std::shuffle(syllables.begin(), syllables.end(), rng);

    std::uniform_int_distribution<int> partsDist(2, 4);
    int parts = partsDist(rng);

    std::string name;
    for (int i = 0; i < parts; ++i) name += syllables[i];

    if (!name.empty()) name[0] = static_cast<char>(std::toupper(name[0]));

    std::cout << "Your random name: " << name << "\n";

    // Also roll a d20 for fun
    std::uniform_int_distribution<int> d20(1, 20);
    std::cout << "d20 roll: " << d20(rng) << "\n";
    return 0;
}
