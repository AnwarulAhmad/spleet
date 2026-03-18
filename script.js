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
    row.className = 'row';
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
    row.className = 'row';
    row.innerHTML = `
        <input type="text" name="tax_names[]" placeholder="Tax Name (e.g. VAT)">
        <input type="number" step="0.01" name="tax_values[]" placeholder="Amount/Value" required>
        <select name="tax_types[]">
            <option value="amount">Flat Amount</option>
            <option value="percent">Percentage (%)</option>
        </select>
        <button type="button" class="btn-remove" onclick="removeRow(this)" title="Remove">X</button>
    `;
    container.appendChild(row);
}