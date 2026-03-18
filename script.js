// Generic function to remove any row
function removeRow(button) {
    const row = button.closest('.row');
    const container = row.parentElement;
    
    // Make sure they don't delete the very last person!
    if (container.children.length > 1) {
        row.remove();
    } else {
        alert("You must have at least one row!");
    }
}

function addPerson() {
    const container = document.getElementById('people-container');
    const row = document.createElement('div');
    row.className = 'row person-row';
    row.innerHTML = `
        <input type="text" name="names[]" placeholder="Person's Name" required>
        <input type="number" step="0.01" name="costs[]" placeholder="Item Cost" required>
        <button type="button" class="btn-remove" onclick="removeRow(this)" title="Remove">X</button>
    `;
    container.appendChild(row);
}

function addTax() {
    const container = document.getElementById('taxes-container');
    const row = document.createElement('div');
    row.className = 'row tax-row';
    row.innerHTML = `
        <input type="text" name="tax_names[]" placeholder="Tax Name (e.g. VAT)">
        <input type="number" step="0.01" name="tax_values[]" placeholder="Amount/Value" value="0" required>
        <select name="tax_types[]">
            <option value="amount">Flat Amount</option>
            <option value="percent">Percentage (%)</option>
        </select>
        <button type="button" class="btn-remove" onclick="removeRow(this)" title="Remove">X</button>
    `;
    container.appendChild(row);
}

// Format numbers as currency with 2 decimals
function formatMoney(amount) {
    return Number(amount).toFixed(2);
}

// Handle the Form Submission and Math
document.getElementById('bill-form').addEventListener('submit', function(e) {
    e.preventDefault(); // Stop the page from reloading!

    const currency = document.getElementById('currency').value;
    const tipAmount = parseFloat(document.getElementById('tip-amount').value) || 0;
    
    let subtotal = 0;
    let peopleData = [];
    
    // 1. Calculate Subtotal from People
    const personRows = document.querySelectorAll('.person-row');
    personRows.forEach(row => {
        const name = row.querySelector('input[name="names[]"]').value;
        const cost = parseFloat(row.querySelector('input[name="costs[]"]').value) || 0;
        
        if (name && cost > 0) {
            peopleData.push({ name, cost });
            subtotal += cost;
        }
    });

    const resultsContainer = document.getElementById('results-container');

    if (subtotal === 0) {
        resultsContainer.innerHTML = `
            <div class="liquid-glass-box">
                <p style="color: #ff4d4d; font-weight: bold;">Please ensure the item costs total more than zero.</p>
            </div>`;
        return;
    }

    // 2. Calculate Taxes
    let totalTaxAmount = 0;
    let activeTaxes = [];
    
    const taxRows = document.querySelectorAll('.tax-row');
    taxRows.forEach((row, index) => {
        let tName = row.querySelector('input[name="tax_names[]"]').value.trim();
        const tValue = parseFloat(row.querySelector('input[name="tax_values[]"]').value) || 0;
        const tType = row.querySelector('select[name="tax_types[]"]').value;

        if (tValue > 0) {
            let calculatedTax = (tType === 'percent') ? (subtotal * (tValue / 100)) : tValue;
            totalTaxAmount += calculatedTax;
            
            let displayName = tName !== "" ? tName : "Tax " + (index + 1);
            activeTaxes.push({ name: displayName, amount: calculatedTax });
        }
    });

    // 3. Calculate Ratios
    const taxRatio = totalTaxAmount / subtotal;
    const tipRatio = tipAmount / subtotal;

    // 4. Generate the HTML Results
    let resultsHTML = `
        <div class="liquid-glass-box">
            <h3>Individual Breakdown</h3>
            <ul style="list-style: none; padding-left: 0;">
    `;

    peopleData.forEach(person => {
        const personTax = person.cost * taxRatio;
        const personTip = person.cost * tipRatio;
        const totalOwed = person.cost + personTax + personTip;

        resultsHTML += `
            <li style="margin-bottom: 12px; background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px;">
                <strong>${person.name}</strong> pays 
                <strong style="color: #a8e6cf; font-size: 1.1em;">${currency}${formatMoney(totalOwed)}</strong>
                <br>
                <small>(Items: ${currency}${formatMoney(person.cost)} | Taxes: ${currency}${formatMoney(personTax)} | Tip: ${currency}${formatMoney(personTip)})</small>
            </li>
        `;
    });

    resultsHTML += `</ul><hr><h3>Receipt Summary</h3>`;
    resultsHTML += `<p><strong>Subtotal:</strong> ${currency}${formatMoney(subtotal)}</p>`;
    
    activeTaxes.forEach(tax => {
        resultsHTML += `<p><strong>${tax.name}:</strong> ${currency}${formatMoney(tax.amount)}</p>`;
    });
    
    resultsHTML += `<p><strong>Tip:</strong> ${currency}${formatMoney(tipAmount)}</p>`;
    
    const grandTotal = subtotal + totalTaxAmount + tipAmount;
    resultsHTML += `<h4 style="color: #a8e6cf; font-size: 20px;">Total Bill: ${currency}${formatMoney(grandTotal)}</h4>`;
    
    resultsHTML += `</div>`;

    // 5. Inject Results into the Page
    resultsContainer.innerHTML = resultsHTML;
});
