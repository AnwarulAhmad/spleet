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
    <title>Bill Splitter</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <svg style="display: none;">
        <defs>
            <filter id="liquid-glass-filter" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="15" xChannelSelector="R" yChannelSelector="G" />
            </filter>
        </defs>
    </svg>

    <div class="liquid-glass-box">
        <h2>Bill Splitter</h2>
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

            <hr>

            <h3>1. Who ordered what?</h3>
            <div id="people-container">
                <?php foreach ($peopleInputs as $p): ?>
                    <div class="row">
                        <input type="text" name="names[]" placeholder="Person's Name" value="<?= $p['name'] ?>" required>
                        <input type="number" step="0.01" name="costs[]" placeholder="Item Cost" value="<?= $p['cost'] ?>" required>
                        <button type="button" class="btn-remove" onclick="removeRow(this)" title="Remove">X</button>
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
                        <button type="button" class="btn-remove" onclick="removeRow(this)" title="Remove">X</button>
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
    </div>

    <?php if (!empty($results)): ?>
        <div class="liquid-glass-box">
            <h3>Individual Breakdown</h3>
            <ul style="list-style: none; padding-left: 0;">
                <?php foreach ($results as $result): ?>
                    <li style="margin-bottom: 12px; background: rgba(255,255,255,0.3); padding: 10px; border-radius: 8px;">
                        <strong><?= $result['name'] ?></strong> pays 
                        <strong style="color: #155724;"><?= $currency ?><?= number_format($result['total'], 2) ?></strong>
                        <br>
                        <small>(Items: <?= $currency ?><?= number_format($result['cost'], 2) ?> | Taxes: <?= $currency ?><?= number_format($result['tax'], 2) ?> | Tip: <?= $currency ?><?= number_format($result['tip'], 2) ?>)</small>
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
            <h4 style="color: #155724; font-size: 20px;">Total Bill: <?= $currency ?><?= number_format($subtotal + $totalTaxAmount + $totalTip, 2) ?></h4>
        </div>
    <?php elseif ($_SERVER["REQUEST_METHOD"] == "POST" && $subtotal == 0): ?>
        <div class="liquid-glass-box">
            <p style="color: #721c24; font-weight: bold;">Please ensure the item costs total more than zero.</p>
        </div>
    <?php endif; ?>

    <script src="script.js"></script>
</body>
</html>