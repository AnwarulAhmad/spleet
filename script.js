// ... (keep your removeRow, addPerson, addTax, and formatMoney functions here) ...

// Handle the Form Submission and Math
document.getElementById('bill-form').addEventListener('submit', function(e) {
    e.preventDefault(); 

    const currency = document.getElementById('currency').value;
    const tipAmount = parseFloat(document.getElementById('tip-amount').value) || 0;
    
    let subtotal = 0;
    let peopleData = [];
    
    const personRows = document.querySelectorAll('.person-row');
    personRows.forEach(row => {
        const name = row.querySelector('input[name="names[]"]').value;
        const cost = parseFloat(row.querySelector('input[name="costs[]"]').value) || 0;
        if (name && cost > 0) { peopleData.push({ name, cost }); subtotal += cost; }
    });

    const resultsContainer = document.getElementById('results-container');

    if (subtotal === 0) {
        resultsContainer.innerHTML = `<p style="color: #ff4d4d; font-weight: bold; margin-top:20px;">Please ensure the item costs total more than zero.</p>`;
        return;
    }

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

    const taxRatio = totalTaxAmount / subtotal;
    const tipRatio = tipAmount / subtotal;

    // CHANGED: Removed the extra liquid-glass-box wrapping so the main one stretches!
    let resultsHTML = `
        <hr>
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
    activeTaxes.forEach(tax => { resultsHTML += `<p><strong>${tax.name}:</strong> ${currency}${formatMoney(tax.amount)}</p>`; });
    resultsHTML += `<p><strong>Tip:</strong> ${currency}${formatMoney(tipAmount)}</p>`;
    
    const grandTotal = subtotal + totalTaxAmount + tipAmount;
    resultsHTML += `<h4 style="color: #a8e6cf; font-size: 20px;">Total Bill: ${currency}${formatMoney(grandTotal)}</h4>`;

    resultsContainer.innerHTML = resultsHTML;
});
