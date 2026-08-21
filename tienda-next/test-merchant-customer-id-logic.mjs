/**
 * Script de prueba simple para verificar la lógica de merchantCustomerId
 * 
 * Este script prueba directamente la lógica implementada sin necesidad
 * de tener el servidor corriendo.
 */

// Simulación de la lógica implementada en iniciar-pago/route.ts
function generateMerchantCustomerId(userId, identificacion, merchantTransactionId) {
  return userId || 
         identificacion?.replace(/\D/g, "") || 
         `guest_${merchantTransactionId}`;
}

// Casos de prueba
const testCases = [
  {
    description: 'Usuario autenticado con userId',
    userId: 'firebase_user_001',
    identificacion: '0912345678',
    merchantTransactionId: 'ord_abc123',
    expected: 'firebase_user_001'
  },
  {
    description: 'Usuario autenticado diferente',
    userId: 'firebase_user_002',
    identificacion: '0923456789',
    merchantTransactionId: 'ord_def456',
    expected: 'firebase_user_002'
  },
  {
    description: 'Usuario invitado con cédula',
    userId: null,
    identificacion: '0934567890',
    merchantTransactionId: 'ord_ghi789',
    expected: '0934567890'
  },
  {
    description: 'Usuario invitado diferente con cédula',
    userId: null,
    identificacion: '0945678901',
    merchantTransactionId: 'ord_jkl012',
    expected: '0945678901'
  },
  {
    description: 'Usuario invitado sin cédula (primera transacción)',
    userId: null,
    identificacion: '',
    merchantTransactionId: 'ord_mno345',
    expected: 'guest_ord_mno345'
  },
  {
    description: 'Usuario invitado sin cédula (segunda transacción)',
    userId: null,
    identificacion: '',
    merchantTransactionId: 'ord_pqr678',
    expected: 'guest_ord_pqr678'
  },
  {
    description: 'Usuario autenticado sin cédula',
    userId: 'firebase_user_003',
    identificacion: '',
    merchantTransactionId: 'ord_stu901',
    expected: 'firebase_user_003'
  },
  {
    description: 'Cédula con guiones y espacios',
    userId: null,
    identificacion: '09-1234-567-8',
    merchantTransactionId: 'ord_vwx234',
    expected: '0912345678'
  },
  {
    description: 'Cédula con formato RUC',
    userId: null,
    identificacion: '0927584839001',
    merchantTransactionId: 'ord_yza567',
    expected: '0927584839001'
  }
];

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  PRUEBA DE LÓGICA - MERCHANT CUSTOMER ID                  ║');
console.log('║  Verificación de unicidad para certificación Datafast     ║');
console.log('╚════════════════════════════════════════════════════════════╝');

let passedTests = 0;
let failedTests = 0;
const results = [];

testCases.forEach((testCase, index) => {
  const result = generateMerchantCustomerId(
    testCase.userId,
    testCase.identificacion,
    testCase.merchantTransactionId
  );
  
  const passed = result === testCase.expected;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST ${index + 1}: ${testCase.description}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Input:`);
  console.log(`  userId: ${testCase.userId || 'null'}`);
  console.log(`  identificación: ${testCase.identificacion || 'null'}`);
  console.log(`  merchantTransactionId: ${testCase.merchantTransactionId}`);
  console.log(`\nOutput:`);
  console.log(`  merchantCustomerId: ${result}`);
  console.log(`  esperado: ${testCase.expected}`);
  console.log(`\nResultado: ${passed ? '✅ PASÓ' : '❌ FALLÓ'}`);
  
  if (passed) {
    passedTests++;
  } else {
    failedTests++;
  }
  
  results.push({
    test: testCase.description,
    userId: testCase.userId,
    identificacion: testCase.identificacion,
    merchantTransactionId: testCase.merchantTransactionId,
    result: result,
    expected: testCase.expected,
    passed: passed
  });
});

// Resumen
console.log('\n\n' + '='.repeat(60));
console.log('RESUMEN DE RESULTADOS');
console.log('='.repeat(60));
console.log(`✅ Pruebas pasadas: ${passedTests}/${testCases.length}`);
console.log(`❌ Pruebas fallidas: ${failedTests}/${testCases.length}`);

// Análisis de unicidad
console.log('\n' + '='.repeat(60));
console.log('ANÁLISIS DE UNICIDAD');
console.log('='.repeat(60));

const merchantCustomerIds = results.map(r => r.result);
const uniqueIds = new Set(merchantCustomerIds);
const hasDuplicates = uniqueIds.size !== merchantCustomerIds.length;

console.log(`\nTotal de merchantCustomerId generados: ${merchantCustomerIds.length}`);
console.log(`merchantCustomerId únicos: ${uniqueIds.size}`);
console.log(`¿Hay duplicados?: ${hasDuplicates ? '⚠️ SÍ' : '✅ NO'}`);

console.log('\n📋 Lista de merchantCustomerId generados:');
results.forEach((r, i) => {
  const status = r.passed ? '✅' : '❌';
  console.log(`${status} ${i + 1}. ${r.result} (${r.test})`);
});

if (hasDuplicates) {
  console.log('\n⚠️ ADVERTENCIA: Se detectaron merchantCustomerId duplicados.');
  const duplicates = merchantCustomerIds.filter((id, index) => 
    merchantCustomerIds.indexOf(id) !== index
  );
  console.log('Duplicados encontrados:', [...new Set(duplicates)]);
} else {
  console.log('\n✅ ÉXITO: Todos los merchantCustomerId son únicos.');
  console.log('La lógica implementada cumple con el requisito de Datafast.');
}

// Simulación del escenario del script de certificación
console.log('\n' + '='.repeat(60));
console.log('SIMULACIÓN ESCENARIO SCRIPT CERTIFICACIÓN');
console.log('='.repeat(60));

const certificationTests = [
  { id: 'TEST-001', userId: 'user_001', identificacion: '0912345678', transactionId: 'tx_001' },
  { id: 'TEST-002', userId: 'user_002', identificacion: '0923456789', transactionId: 'tx_002' },
  { id: 'TEST-003', userId: 'user_003', identificacion: '0934567890', transactionId: 'tx_003' },
  { id: 'TEST-004', userId: 'user_004', identificacion: '0945678901', transactionId: 'tx_004' },
  { id: 'TEST-005', userId: 'user_005', identificacion: '0956789012', transactionId: 'tx_005' },
  { id: 'TEST-006', userId: 'user_006', identificacion: '0967890123', transactionId: 'tx_006' },
  { id: 'TEST-007', userId: 'user_007', identificacion: '0978901234', transactionId: 'tx_007' },
  { id: 'TEST-008', userId: 'user_008', identificacion: '0989012345', transactionId: 'tx_008' },
  { id: 'TEST-009', userId: 'user_009', identificacion: '0990123456', transactionId: 'tx_009' },
  { id: 'TEST-010', userId: 'user_010', identificacion: '0901234567', transactionId: 'tx_010' }
];

console.log('\n📊 merchantCustomerId para el script de certificación:');
const certMerchantIds = certificationTests.map(test => {
  const merchantId = generateMerchantCustomerId(test.userId, test.identificacion, test.transactionId);
  console.log(`${test.id}: ${merchantId} (userId: ${test.userId}, cédula: ${test.identificacion})`);
  return merchantId;
});

const certUniqueIds = new Set(certMerchantIds);
const certHasDuplicates = certUniqueIds.size !== certMerchantIds.length;

console.log('\n🔍 Verificación para certificación:');
console.log(`   Total de pruebas: ${certMerchantIds.length}`);
console.log(`   merchantCustomerId únicos: ${certUniqueIds.size}`);
console.log(`   ¿Cumple requisito Datafast?: ${certHasDuplicates ? '❌ NO' : '✅ SÍ'}`);

console.log('\n' + '='.repeat(60));
console.log('CONCLUSIÓN');
console.log('='.repeat(60));

if (failedTests === 0 && !hasDuplicates && !certHasDuplicates) {
  console.log('✅ La implementación es CORRECTA.');
  console.log('✅ Todos los merchantCustomerId son únicos.');
  console.log('✅ Cumple con el requisito de Datafast para certificación.');
  console.log('\n📝 Puedes proceder con confianza a enviar el script de certificación.');
} else {
  console.log('❌ La implementación tiene problemas.');
  console.log('❌ Revisa la lógica antes de enviar a certificación.');
}

console.log('='.repeat(60));