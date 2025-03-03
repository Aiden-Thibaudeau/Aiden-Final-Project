function bruteForceGuess(target) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let attempt = "";
    let attempts = 0;
    
    function generateCombination(length) {
        let guess = "";
        for (let i = 0; i < length; i++) {
            guess += chars[Math.floor(Math.random() * chars.length)];
        }
        return guess;
    }
    
    while (attempt !== target) {
        attempt = generateCombination(target.length);
        attempts++;
        console.log(`Attempt ${attempts}: ${attempt}`);
    }
    
    console.log(`Code cracked! The code was "${target}". Found in ${attempts} attempts.`);
}

// Example usage:
let userCode = prompt("Enter a code to be brute forced:");
bruteForceGuess(userCode);