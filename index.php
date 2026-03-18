<?php
// Initialize variables
$results = [];
$subtotal = 0;
$totalTaxAmount = 0;
$totalTip = 0;
$currency = '$';
$activeTaxes = []; 

$peopleInputs = [];
$taxInputs = [];

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $currency = $_POST['currency'] ?? '$';
    $totalTip = floatval($_POST['tip'] ?? 0);

    // Rebuild People inputs
    $names = $_POST['names'] ?? [];
    $costs = $_POST['costs'] ?? [];
    for ($i = 0; $i < count($costs); $i++) {
        $cost = floatval($costs[$i]);
        $peopleInputs[] = [
            'name' => htmlspecialchars($names[$i] ?? ''),
            'cost' => $cost
        ];
        $subtotal += $cost;
    }

    // Rebuild Tax inputs
    $taxNames = $_POST['tax_names'] ?? [];
    $taxValues = $_POST['tax_values'] ?? [];
    $taxTypes = $_POST['tax_types'] ?? [];
    
    if ($subtotal > 0) {
        for ($j = 0; $j < count($taxValues); $j++) {
            $tName = htmlspecialchars($taxNames[$j] ?? '');
            $tValue = floatval($taxValues[$j] ?? 0);
            $tType = $taxTypes[$j] ?? 'amount';
            
            $taxInputs[] = ['name' => $tName, 'value' => $tValue, 'type' => $tType];

            $calculatedTax = ($tType === 'percent') ? ($subtotal * ($tValue / 100)) : $tValue;
            $totalTaxAmount += $calculatedTax;
            
            $displayName = !empty(trim($tName)) ? $tName : "Tax " . ($j + 1);
            $activeTaxes[] = ['name' => $displayName, 'amount' => $calculatedTax];
        }

        // Ratios
        $taxRatio = $totalTaxAmount / $subtotal;
        $tipRatio = $totalTip / $subtotal;

        // Calculate breakdown
        foreach ($peopleInputs as $person) {
            if (!empty($person['name']) && $person['cost'] > 0) {
                $personTax = $person['cost'] * $taxRatio;
                $personTip = $person['cost'] * $tipRatio;
                $totalOwed = $person['cost'] + $personTax + $personTip;

                $results[] = [
                    'name' => $person['name'],
                    'cost' => $person['cost'],
                    'tax' => $personTax,
                    'tip' => $personTip,
                    'total' => $totalOwed
                ];
            }
        }
    }
} else {
    $peopleInputs = [ ['name' => '', 'cost' => ''], ['name' => '', 'cost' => ''] ];
    $taxInputs = [ ['name' => '', 'value' => '', 'type' => 'amount'] ];
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Advanced Bill Splitter</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <h2>Advanced Fair Bill Splitter</h2>

    <form method="POST" action="">
        <div class="row">
            <label><strong>Currency:</strong></label>
            <select name="currency">
                <option value="$" <?= $currency === '$' ? 'selected' : '' ?>>USD ($)</option>
                <option value="RM" <?= $currency === 'RM' ? 'selected' : '' ?>>MYR (RM)</option>
                <option value="€" <?= $currency === '€' ? 'selected' : '' ?>>EUR (€)</option>
                <option value="£" <?= $currency === '£' ? 'selected' : '' ?>>GBP (£)</option>
                <option value="¥" <?= $currency === '¥' ? 'selected' : '' ?>>JPY (¥)</option>
            </select>
        </div>
<div class="glass-card">
        <h1>Split Project</h1>
        <p>PHP Server is running on localhost:8000</p>
        <button style="background: white; border: none; padding: 10px 20px; border-radius: 5px;">
            Get Started
        </button>
    </div>
        <hr>

        <h3>1. Who ordered what?</h3>
        <div id="people-container">
            <?php foreach ($peopleInputs as $p): ?>
                <div class="row">
                    <input type="text" name="names[]" placeholder="Person's Name" value="<?= $p['name'] ?>" required>
                    <input type="number" step="0.01" name="costs[]" placeholder="Item Cost" value="<?= $p['cost'] ?>" required>
                </div>
            <?php endforeach; ?>
        </div>
        <button type="button" class="btn-add" onclick="addPerson()">+ Add Another Person</button>

        <hr>

        <h3>2. Taxes & Fees</h3>
        <div id="taxes-container">
            <?php foreach ($taxInputs as $t): ?>
                <div class="row">
                    <input type="text" name="tax_names[]" placeholder="Tax Name (e.g. VAT)" value="<?= $t['name'] ?>">
                    <input type="number" step="0.01" name="tax_values[]" placeholder="Amount/Value" value="<?= $t['value'] ?>" required>
                    <select name="tax_types[]">
                        <option value="amount" <?= $t['type'] === 'amount' ? 'selected' : '' ?>>Flat Amount</option>
                        <option value="percent" <?= $t['type'] === 'percent' ? 'selected' : '' ?>>Percentage (%)</option>
                    </select>
                </div>
            <?php endforeach; ?>
        </div>
        <button type="button" class="btn-add" onclick="addTax()">+ Add Another Tax</button>

        <hr>

        <h3>3. Tip / Service Charge</h3>
        <div class="row">
            <label>Total Tip (Flat Amount):</label>
            <input type="number" step="0.01" name="tip" value="<?= $totalTip ?>" required>
        </div>

        <button type="submit" class="btn-submit">Calculate Split</button>
    </form>

    <?php if (!empty($results)): ?>
        <div class="results-box">
            <h3>Individual Breakdown</h3>
            <ul>
                <?php foreach ($results as $result): ?>
                    <li style="margin-bottom: 10px;">
                        <strong><?= $result['name'] ?></strong> pays 
                        <strong style="color: #28a745;"><?= $currency ?><?= number_format($result['total'], 2) ?></strong>
                        <br>
                        <small>(Items: <?= $currency ?><?= number_format($result['cost'], 2) ?> | Total Taxes: <?= $currency ?><?= number_format($result['tax'], 2) ?> | Tip: <?= $currency ?><?= number_format($result['tip'], 2) ?>)</small>
                    </li>
                <?php endforeach; ?>
            </ul>
            <hr>
            <h3>Receipt Summary</h3>
            <p><strong>Subtotal:</strong> <?= $currency ?><?= number_format($subtotal, 2) ?></p>
            <?php foreach ($activeTaxes as $at): ?>
                <p><strong><?= $at['name'] ?>:</strong> <?= $currency ?><?= number_format($at['amount'], 2) ?></p>
            <?php endforeach; ?>
            <p><strong>Tip:</strong> <?= $currency ?><?= number_format($totalTip, 2) ?></p>
            <h4 style="color: #28a745;">Total Bill: <?= $currency ?><?= number_format($subtotal + $totalTaxAmount + $totalTip, 2) ?></h4>
        </div>
    <?php elseif ($_SERVER["REQUEST_METHOD"] == "POST" && $subtotal == 0): ?>
        <p style="color: red;">Please ensure the item costs total more than zero.</p>
    <?php endif; ?>

    <script src="script.js"></script>
</body>
</html>