function addPerson() {
    const container = document.getElementById('people-container');
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
        <input type="text" name="names[]" placeholder="Person's Name" required>
        <input type="number" step="0.01" name="costs[]" placeholder="Item Cost" required>
    `;
    container.appendChild(row);
}

function addTax() {
    const container = document.getElementById('taxes-container');
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
        <input type="text" name="tax_names[]" placeholder="Tax Name (e.g. VAT)">
        <input type="number" step="0.01" name="tax_values[]" placeholder="Amount/Value" required>
        <select name="tax_types[]">
            <option value="amount">Flat Amount</option>
            <option value="percent">Percentage (%)</option>
        </select>
    `;
    container.appendChild(row);
}