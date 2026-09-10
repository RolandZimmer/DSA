// g++ -std=c++17 -Wall -Wextra -pedantic hash_demo.cpp -o hash_demo
// Keys: -9999..9999. Resize explicitly to demonstrate rehashing.
#include <algorithm>
#include <cmath>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

int mod(long long key, int m) { return int((key % m + m) % m); }
bool prime(int n) {
    if (n < 2) return false;
    for (int d = 2; d * d <= n; ++d) if (n % d == 0) return false;
    return true;
}
struct Config {
    std::string method = "division", strategy = "linear";
    int size = 11;
};
void validate(const Config& c) {
    const std::vector<std::string> methods{"division", "mid-square", "multiplication"};
    const std::vector<std::string> strategies{"linear", "quadratic", "double", "chaining"};
    if (std::find(methods.begin(), methods.end(), c.method) == methods.end() ||
        std::find(strategies.begin(), strategies.end(), c.strategy) == strategies.end())
        throw std::invalid_argument("Unknown method or strategy");
    if (c.size < 2 || c.size > 31) throw std::invalid_argument("Size must be 2..31");
    if ((c.strategy == "quadratic" || c.strategy == "double") && !prime(c.size))
        throw std::invalid_argument("Use a prime size for quadratic/double probing");
}
int hashKey(int key, const Config& c) {
    validate(c);
    if (key < -9999 || key > 9999) throw std::invalid_argument("Key must be -9999..9999");
    if (c.method == "division") return mod(key, c.size);
    if (c.method == "mid-square") {
        // Eight-digit padded square, middle two digits (positions 4 and 5).
        long long square = 1LL * key * key;
        return int(square / 1000 % 100) % c.size;
    }
    if (c.method == "multiplication") {
        const double A = 0.6180339887498949;
        double product = std::abs(key) * A;
        return int(std::floor(c.size * (product - std::floor(product))));
    }
    throw std::invalid_argument("Unknown method");
}
class HashTable {
    enum State { EMPTY, OCCUPIED, DELETED };
    Config c;
    std::vector<int> values;
    std::vector<State> states;
    std::vector<std::vector<int>> buckets;
    int count = 0;
public:
    explicit HashTable(Config options) : c(options) {
        validate(c); values.resize(c.size); states.assign(c.size, EMPTY); buckets.resize(c.size);
    }
    bool operate(const std::string& action, int key) {
        if (action != "insert" && action != "find" && action != "delete")
            throw std::invalid_argument("Use insert, find or delete");
        int home = hashKey(key, c);
        if (c.strategy == "chaining") {
            auto& bucket = buckets[home];
            auto at = std::find(bucket.begin(), bucket.end(), key);
            bool exists = at != bucket.end();
            if (action == "insert" && !exists) { bucket.push_back(key); ++count; }
            if (action == "delete" && exists) { bucket.erase(at); --count; }
            return action == "insert" || exists;
        }
        int firstDeleted = -1;
        int stride = c.strategy == "double" ? 1 + mod(key, c.size - 1) : 1;
        auto insertAt = [&](int pos) { values[pos] = key; states[pos] = OCCUPIED; ++count; };
        for (int i = 0; i < c.size; ++i) {
            int pos = (home + (c.strategy == "quadratic" ? i * i : i * stride)) % c.size;
            if (states[pos] == OCCUPIED && values[pos] == key) {
                if (action == "delete") { states[pos] = DELETED; --count; }
                return true; // Duplicate insertion leaves the set unchanged.
            }
            if (states[pos] == DELETED && firstDeleted < 0) firstDeleted = pos;
            if (states[pos] == EMPTY) {
                if (action != "insert") return false;
                insertAt(firstDeleted >= 0 ? firstDeleted : pos); return true;
            }
        }
        // Scan the full sequence before reusing a tombstone to avoid duplicates.
        if (action == "insert" && firstDeleted >= 0) { insertAt(firstDeleted); return true; }
        return false; // Quadratic probes may exhaust their subset before the table is full.
    }
    void rehash(int size) {
        Config next = c; next.size = size;
        HashTable candidate(next);
        auto moveKey = [&](int key) {
            if (!candidate.operate("insert", key))
                throw std::invalid_argument("Resize failed; choose a larger size. Original table preserved.");
        };
        if (c.strategy == "chaining") {
            for (const auto& bucket : buckets) for (int key : bucket) moveKey(key);
        } else {
            for (int i = 0; i < c.size; ++i) if (states[i] == OCCUPIED) moveKey(values[i]);
        }
        *this = candidate; // Commit only after all live keys fit.
    }
    void print() const {
        for (int i = 0; i < c.size; ++i) {
            std::cout << i << ": ";
            if (c.strategy == "chaining") {
                if (buckets[i].empty()) std::cout << "EMPTY";
                for (int key : buckets[i]) std::cout << key << ' ';
            } else if (states[i] == EMPTY) std::cout << "EMPTY";
            else if (states[i] == DELETED) std::cout << "DEL";
            else std::cout << values[i];
            std::cout << '\n';
        }
        std::cout << "n=" << count << ", load=" << double(count) / c.size << '\n';
    }
};
#ifndef DSA_HASH_NO_MAIN
int main() {
    try {
        Config c;
        std::cout << "Method (division/mid-square/multiplication), strategy (linear/quadratic/double/chaining), size:\n";
        if (!(std::cin >> c.method >> c.strategy >> c.size)) return 1;
        HashTable table(c);
        std::cout << "Commands: insert KEY, find KEY, delete KEY, resize SIZE, print, quit\n";
        std::string command;
        while (std::cin >> command && command != "quit") {
            if (command == "print") { table.print(); continue; }
            int key;
            if (!(std::cin >> key)) return 1;
            try {
                if (command == "resize") { table.rehash(key); table.print(); continue; }
                bool result = table.operate(command, key);
                std::cout << (result ? "OK (insert keeps unique keys)" : "Not found / insertion failed: probe sequence exhausted") << '\n';
                table.print();
            } catch (const std::exception& e) { std::cerr << e.what() << '\n'; }
        }
    } catch (const std::exception& e) { std::cerr << e.what() << '\n'; return 1; }
}
#endif
