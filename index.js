// Calculator state variables
let racun = [];
let noviDisplay = '';
let dozvoli = true;
let waitingForNumber = false;
let calculationHistory = '';
let lastResult = null;

// Initialize when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize display
    updateDisplay('0');
    
    // Add keyboard support
    document.addEventListener('keydown', handleKeyPress);
    
    // Set up theme toggle
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', toggleTheme);
    
    // Check for saved theme preference
    if (localStorage.getItem('calculatorTheme') === 'light') {
        document.body.classList.add('light-theme');
        themeToggle.querySelector('.theme-icon').textContent = '🌙';
        document.querySelector('.calculator-title').textContent = 'Calculator (Light)';
    }
});

function addNumber(number) {
    if (dozvoli) {
        // Handle decimal point logic
        if (number === '.' && noviDisplay.includes('.')) {
            return; // Prevent multiple decimal points
        }
        
        // Handle display after calculation
        if (lastResult !== null) {
            if (waitingForNumber) {
                noviDisplay = number;
                lastResult = null;
            } else {
                clearAll();
                noviDisplay = number;
            }
        } 
        // Handle normal number input
        else if (waitingForNumber) {
            // Start fresh number after operator
            noviDisplay = number;
            waitingForNumber = false;
        } else {
            // Continue building current number
            noviDisplay = noviDisplay === '0' && number !== '.' ? number : noviDisplay + number;
        }
        
        updateDisplay(noviDisplay);
        animateButton(number);
    }
}

function addFunction(akcija) {
    animateButton(akcija);
    
    // Handle different function types
    if (akcija === 'clear') {
        clearAll();
        return;
    }
    
    if (akcija === 'backspace') {
        handleBackspace();
        return;
    }
    
    if (akcija === '=') {
        // Add the current number to calculation array
        if (noviDisplay !== '') {
            racun.push(parseFloat(noviDisplay));
            updateHistory();
        }
        performCalculation();
        waitingForNumber = true;
    } else {
        // Operator pressed (+, -, *, /)
        if (noviDisplay !== '') {
            racun.push(parseFloat(noviDisplay));
            updateHistory(akcija);
        } else if (lastResult !== null) {
            // Use previous result for new calculation
            racun.push(lastResult);
            updateHistory(akcija);
        }
        
        // Replace last operator if sequential operators are pressed
        if (waitingForNumber && racun.length > 0) {
            if (['+', '-', '*', '/'].includes(racun[racun.length - 1])) {
                racun.pop();
            }
        }
        
        racun.push(akcija);
        waitingForNumber = true;
        
        // Show the operator briefly
        let currentDisplay = noviDisplay || (lastResult !== null ? lastResult.toString() : '0');
        flashOperator(akcija, currentDisplay);
    }
}

function performCalculation() {
    if (racun.length < 3) return; // Need at least number, operator, number
    
    // Calculate with proper order of operations
    try {
        // Clone array to preserve original for history
        let calcArray = [...racun];
        
        // First handle multiplication and division
        for (let i = 1; i < calcArray.length; i += 2) {
            if (calcArray[i] === '*' || calcArray[i] === '/') {
                let result;
                if (calcArray[i] === '*') {
                    result = calcArray[i - 1] * calcArray[i + 1];
                } else {
                    if (calcArray[i + 1] === 0) throw new Error('Division by zero');
                    result = calcArray[i - 1] / calcArray[i + 1];
                }
                
                // Replace the operation with the result
                calcArray.splice(i - 1, 3, result);
                i -= 2; // Adjust index
            }
        }
        
        // Then handle addition and subtraction
        let rezultat = calcArray[0];
        for (let i = 1; i < calcArray.length; i += 2) {
            let operator = calcArray[i];
            let number = calcArray[i + 1];
            
            if (operator === '+') rezultat += number;
            else if (operator === '-') rezultat -= number;
        }
        
        // Format result to avoid extreme floating point numbers
        if (rezultat.toString().includes('.')) {
            rezultat = parseFloat(rezultat.toFixed(10));
            // Remove trailing zeros
            rezultat = parseFloat(rezultat.toString());
        }
        
        lastResult = rezultat;
        updateDisplay(rezultat);
        noviDisplay = ''; // Clear input buffer
        flashResult();
        
        // Reset calculation array but keep history
        racun = [];
    } catch (error) {
        updateDisplay('Error');
        document.getElementById('history').textContent = error.message;
        racun = [];
        noviDisplay = '';
        setTimeout(() => {
            updateDisplay('0');
            document.getElementById('history').textContent = '';
        }, 2000);
    }
}

function updateHistory(operator) {
    let historyElement = document.getElementById('history');
    
    // Build history text
    if (racun.length > 0) {
        calculationHistory = '';
        racun.forEach((item, index) => {
            if (index % 2 === 0) {
                // Number
                calculationHistory += item;
            } else {
                // Operator - convert to more readable symbols
                let symbol = item;
                if (item === '*') symbol = '×';
                if (item === '/') symbol = '÷';
                calculationHistory += ' ' + symbol + ' ';
            }
        });
        
        if (operator) {
            calculationHistory += ' ' + (operator === '*' ? '×' : operator === '/' ? '÷' : operator);
        }
        
        historyElement.textContent = calculationHistory;
    }
}

function updateDisplay(content) {
    document.getElementById('box').textContent = content;
}

function clearDisplay() {
    document.getElementById('box').textContent = '0';
}

function clearAll() {
    clearDisplay();
    noviDisplay = '';
    racun = [];
    waitingForNumber = false;
    lastResult = null;
    document.getElementById('history').textContent = '';
}

function handleBackspace() {
    if (noviDisplay.length > 0) {
        noviDisplay = noviDisplay.slice(0, -1);
        if (noviDisplay === '') {
            noviDisplay = '0';
        }
        updateDisplay(noviDisplay);
    }
}

// Animation functions
function animateButton(value) {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        // Match button by text content or specific classes
        if (button.textContent === value || 
            (value === 'clear' && button.classList.contains('clear-button')) ||
            (value === 'backspace' && button.classList.contains('backspace-button')) ||
            (value === '=' && button.classList.contains('equals-button'))) {
            button.classList.add('active');
            setTimeout(() => button.classList.remove('active'), 150);
        }
    });
}

function flashOperator(operator, previousDisplay) {
    const display = document.getElementById('box');
    const operatorSymbol = operator === '*' ? '×' : operator === '/' ? '÷' : operator;
    
    // Flash operator
    display.textContent = operatorSymbol;
    display.classList.add('flash');
    
    // Return to previous display
    setTimeout(() => {
        display.classList.remove('flash');
        display.textContent = previousDisplay;
    }, 300);
}

function flashResult() {
    const display = document.getElementById('box');
    display.classList.add('flash');
    setTimeout(() => display.classList.remove('flash'), 300);
}

// Keyboard support
function handleKeyPress(e) {
    if ((e.key >= '0' && e.key <= '9') || e.key === '.') {
        addNumber(e.key);
    } else if (e.key === '+' || e.key === '-') {
        addFunction(e.key);
    } else if (e.key === '*' || e.key === 'x' || e.key === 'X') {
        addFunction('*');
    } else if (e.key === '/' || e.key === '÷') {
        addFunction('/');
    } else if (e.key === 'Enter' || e.key === '=') {
        addFunction('=');
    } else if (e.key === 'Escape') {
        addFunction('clear');
    } else if (e.key === 'Backspace') {
        addFunction('backspace');
    }
}

// Theme toggle functionality
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('.theme-icon');
    
    body.classList.toggle('light-theme');
    
    if (body.classList.contains('light-theme')) {
        localStorage.setItem('calculatorTheme', 'light');
        themeIcon.textContent = '🌙';
        document.querySelector('.calculator-title').textContent = 'Calculator (Light)';
    } else {
        localStorage.setItem('calculatorTheme', 'dark');
        themeIcon.textContent = '☀️';
        document.querySelector('.calculator-title').textContent = 'Calculator';
    }
    
    // Flash animation to indicate theme change
    document.getElementById('Calculator').classList.add('theme-transition');
    setTimeout(() => {
        document.getElementById('Calculator').classList.remove('theme-transition');
    }, 300);
}