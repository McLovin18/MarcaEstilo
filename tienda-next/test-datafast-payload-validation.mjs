/**
 * Script de validación de payload enviado a Datafast
 * 
 * Este script verifica que todos los campos requeridos por Datafast
 * estén correctamente formateados según su documentación.
 */

// Simulación de la función de preparación de payload
function prepareDatafastPayload(testData) {
  const { cliente, direccion, productos, totalCliente, userId, merchantTransactionId } = testData;
  
  const checkoutPayload = new Map();
  
  // Campos obligatorios Datafast
  checkoutPayload.set("entityId", "8a829418533cf31d01533d06f2ee06fa");
  checkoutPayload.set("amount", totalCliente.toFixed(2));
  checkoutPayload.set("currency", "USD");
  checkoutPayload.set("paymentType", "DB");
  checkoutPayload.set("testMode", "EXTERNAL");
  
  // Dividir nombre
  const nombreParts = cliente.nombreSolo?.split(" ") || cliente.nombre?.split(" ") || [];
  const givenName = nombreParts[0] || "";
  const middleName = nombreParts.slice(1).join(" ") || ".";
  
  // Formatear identificación
  const identificacion = cliente.identificacion.replace(/\D/g, "").slice(0, 10).padStart(10, "0");
  
  // Datos del cliente
  checkoutPayload.set("customer.givenName", givenName);
  checkoutPayload.set("customer.middleName", middleName);
  checkoutPayload.set("customer.surname", cliente.apellido || "");
  checkoutPayload.set("customer.ip", "127.0.0.1");
  
  // Lógica de merchantCustomerId implementada
  const merchantCustomerId = userId || 
                             cliente.identificacion?.replace(/\D/g, "") || 
                             `guest_${merchantTransactionId}`;
  checkoutPayload.set("customer.merchantCustomerId", merchantCustomerId);
  checkoutPayload.set("merchantTransactionId", merchantTransactionId);
  checkoutPayload.set("customer.email", cliente.email);
  checkoutPayload.set("customer.identificationDocType", "IDCARD");
  checkoutPayload.set("customer.identificationDocId", identificacion);
  checkoutPayload.set("customer.phone", cliente.telefono);
  
  // Direcciones
  checkoutPayload.set("billing.street1", `${direccion.direccion}, ${direccion.ciudad}, ${direccion.provincia}`);
  checkoutPayload.set("billing.country", "EC");
  checkoutPayload.set("shipping.street1", `${direccion.direccion}, ${direccion.ciudad}, ${direccion.provincia}`);
  checkoutPayload.set("shipping.country", "EC");
  
  // Datos de los productos
  productos.forEach((item, index) => {
    const precio = Number(item.precio || item.precioUnitario || item.precioBase || 0);
    checkoutPayload.set(`cart.items[${index}].name`, item.nombre?.slice(0, 255) || `Producto ${index + 1}`);
    checkoutPayload.set(`cart.items[${index}].description`, item.nombre?.slice(0, 255) || `Producto ${index + 1}`);
    checkoutPayload.set(`cart.items[${index}].price`, precio.toFixed(2));
    checkoutPayload.set(`cart.items[${index}].quantity`, String(item.cantidad || 1));
  });
  
  // Parámetros personalizados Datafast
  checkoutPayload.set("customParameters[SHOPPER_VAL_BASE0]", "0.00");
  checkoutPayload.set("customParameters[SHOPPER_VAL_BASEIMP]", totalCliente.toFixed(2));
  checkoutPayload.set("customParameters[SHOPPER_VAL_IVA]", "0.00");
  checkoutPayload.set("customParameters[SHOPPER_MID]", "1000000406");
  checkoutPayload.set("customParameters[SHOPPER_TID]", "PD100406");
  checkoutPayload.set("customParameters[SHOPPER_ECI]", "0103910");
  checkoutPayload.set("customParameters[SHOPPER_PSERV]", "17913101");
  checkoutPayload.set("customParameters[SHOPPER_VERSIONDF]", "2");
  
  // Risk parameters
  checkoutPayload.set("risk.parameters[USER_DATA2]", "MARCAESTILO");
  
  return checkoutPayload;
}

// Casos de prueba basados en el script de certificación
const testCases = [
  {
    name: 'TEST-001: VISA estándar',
    userId: 'user_001',
    cliente: {
      nombre: 'Juan Perez',
      nombreSolo: 'Juan',
      apellido: 'Perez',
      email: 'juan.perez@test.com',
      telefono: '+593991234567',
      identificacion: '0912345678'
    },
    direccion: {
      provincia: 'Guayas',
      ciudad: 'Guayaquil',
      direccion: 'Av. Principal 123'
    },
    productos: [
      { nombre: 'Camisa Formal', precio: 25.00, cantidad: 1 }
    ],
    totalCliente: 25.00,
    merchantTransactionId: 'tx_001'
  },
  {
    name: 'TEST-002: Mastercard estándar',
    userId: 'user_002',
    cliente: {
      nombre: 'Maria Garcia',
      nombreSolo: 'Maria',
      apellido: 'Garcia',
      email: 'maria.garcia@test.com',
      telefono: '+593997654321',
      identificacion: '0923456789'
    },
    direccion: {
      provincia: 'Pichincha',
      ciudad: 'Quito',
      direccion: 'Calle Secundaria 456'
    },
    productos: [
      { nombre: 'Pantalón Jeans', precio: 35.00, cantidad: 1 }
    ],
    totalCliente: 35.00,
    merchantTransactionId: 'tx_002'
  },
  {
    name: 'TEST-003: AMEX monto alto',
    userId: 'user_003',
    cliente: {
      nombre: 'Carlos Rodriguez',
      nombreSolo: 'Carlos',
      apellido: 'Rodriguez',
      email: 'carlos.rodriguez@test.com',
      telefono: '+593998765432',
      identificacion: '0934567890'
    },
    direccion: {
      provincia: 'Azuay',
      ciudad: 'Cuenca',
      direccion: 'Av. Loja 789'
    },
    productos: [
      { nombre: 'Chaqueta Cuero', precio: 85.00, cantidad: 1 }
    ],
    totalCliente: 85.00,
    merchantTransactionId: 'tx_003'
  },
  {
    name: 'TEST-004: Diners Club',
    userId: 'user_004',
    cliente: {
      nombre: 'Ana Martinez',
      nombreSolo: 'Ana',
      apellido: 'Martinez',
      email: 'ana.martinez@test.com',
      telefono: '+593993456789',
      identificacion: '0945678901'
    },
    direccion: {
      provincia: 'Manabí',
      ciudad: 'Portoviejo',
      direccion: 'Calle Central 321'
    },
    productos: [
      { nombre: 'Zapatos Formales', precio: 32.00, cantidad: 1 }
    ],
    totalCliente: 32.00,
    merchantTransactionId: 'tx_004'
  },
  {
    name: 'TEST-005: VISA fondos insuficientes',
    userId: 'user_005',
    cliente: {
      nombre: 'Roberto Sanchez',
      nombreSolo: 'Roberto',
      apellido: 'Sanchez',
      email: 'roberto.sanchez@test.com',
      telefono: '+593994567890',
      identificacion: '0956789012'
    },
    direccion: {
      provincia: 'Guayas',
      ciudad: 'Guayaquil',
      direccion: 'Av. Urbina 555'
    },
    productos: [
      { nombre: 'Cinturón Piel', precio: 15.00, cantidad: 1 }
    ],
    totalCliente: 15.00,
    merchantTransactionId: 'tx_005'
  }
];

// Campos requeridos por Datafast según documentación
const requiredFields = [
  'entityId',
  'amount',
  'currency',
  'paymentType',
  'customer.givenName',
  'customer.surname',
  'customer.email',
  'customer.phone',
  'customer.identificationDocType',
  'customer.identificationDocId',
  'customer.merchantCustomerId',
  'merchantTransactionId',
  'billing.street1',
  'billing.country',
  'shipping.street1',
  'shipping.country'
];

// Campos recomendados para Ecuador
const recommendedFields = [
  'customer.ip',
  'customer.middleName',
  'customParameters[SHOPPER_MID]',
  'customParameters[SHOPPER_TID]',
  'customParameters[SHOPPER_ECI]',
  'customParameters[SHOPPER_PSERV]',
  'customParameters[SHOPPER_VERSIONDF]',
  'customParameters[SHOPPER_VAL_BASE0]',
  'customParameters[SHOPPER_VAL_BASEIMP]',
  'customParameters[SHOPPER_VAL_IVA]'
];

function validatePayload(payload, testName) {
  const errors = [];
  const warnings = [];
  
  // Verificar campos requeridos
  requiredFields.forEach(field => {
    if (!payload.has(field)) {
      errors.push(`❌ Campo requerido faltante: ${field}`);
    } else if (!payload.get(field)) {
      errors.push(`❌ Campo requerido vacío: ${field}`);
    }
  });
  
  // Verificar campos recomendados
  recommendedFields.forEach(field => {
    if (!payload.has(field)) {
      warnings.push(`⚠️ Campo recomendado faltante: ${field}`);
    }
  });
  
  // Validaciones específicas
  if (payload.get('amount') && parseFloat(payload.get('amount')) <= 0) {
    errors.push('❌ El monto debe ser mayor a 0');
  }
  
  if (payload.get('currency') !== 'USD') {
    errors.push('❌ La moneda debe ser USD para Ecuador');
  }
  
  if (payload.get('paymentType') !== 'DB') {
    warnings.push('⚠️ El paymentType debería ser DB (Debit) para captura inmediata');
  }
  
  if (payload.get('billing.country') !== 'EC' || payload.get('shipping.country') !== 'EC') {
    errors.push('❌ El país debe ser EC para Ecuador');
  }
  
  if (payload.get('customer.identificationDocType') !== 'IDCARD') {
    warnings.push('⚠️ El tipo de documento debería ser IDCARD para Ecuador');
  }
  
  // Validar formato de email
  const email = payload.get('customer.email');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('❌ Formato de email inválido');
  }
  
  // Validar formato de teléfono
  const phone = payload.get('customer.phone');
  if (phone && !/^[\d\+\-\s]+$/.test(phone)) {
    warnings.push('⚠️ Formato de teléfono podría tener problemas');
  }
  
  return { errors, warnings };
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  VALIDACIÓN DE PAYLOAD DATAFAST                           ║');
console.log('║  Verificación de campos para certificación                ║');
console.log('╚════════════════════════════════════════════════════════════╝');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST ${index + 1}: ${testCase.name}`);
  console.log(`${'='.repeat(60)}`);
  
  totalTests++;
  
  const payload = prepareDatafastPayload(testCase);
  const validation = validatePayload(payload, testCase.name);
  
  // Mostrar campos clave
  console.log('\n📋 Campos clave del payload:');
  console.log(`  Entity ID: ${payload.get('entityId')}`);
  console.log(`  Amount: ${payload.get('amount')} ${payload.get('currency')}`);
  console.log(`  Payment Type: ${payload.get('paymentType')}`);
  console.log(`  Merchant Customer ID: ${payload.get('customer.merchantCustomerId')}`);
  console.log(`  Transaction ID: ${payload.get('merchantTransactionId')}`);
  console.log(`  Customer: ${payload.get('customer.givenName')} ${payload.get('customer.surname')}`);
  console.log(`  Email: ${payload.get('customer.email')}`);
  console.log(`  Phone: ${payload.get('customer.phone')}`);
  console.log(`  ID Document: ${payload.get('customer.identificationDocId')}`);
  console.log(`  Billing: ${payload.get('billing.street1')}`);
  console.log(`  Shipping: ${payload.get('shipping.street1')}`);
  
  // Mostrar items del carrito
  console.log('\n🛒 Items del carrito:');
  let itemCount = 0;
  for (let [key, value] of payload.entries()) {
    if (key.startsWith('cart.items[')) {
      console.log(`  ${key}: ${value}`);
      itemCount++;
    }
  }
  if (itemCount === 0) {
    console.log('  (No hay items en el carrito)');
  }
  
  // Mostrar errores y advertencias
  if (validation.errors.length > 0 || validation.warnings.length > 0) {
    console.log('\n⚠️ Problemas encontrados:');
    validation.errors.forEach(error => console.log(`  ${error}`));
    validation.warnings.forEach(warning => console.log(`  ${warning}`));
  }
  
  // Determinar si pasó
  const passed = validation.errors.length === 0;
  if (passed) {
    console.log('\n✅ PAYLOAD VÁLIDO');
    passedTests++;
  } else {
    console.log('\n❌ PAYLOAD INVÁLIDO');
    failedTests++;
  }
});

// Resumen
console.log('\n\n' + '='.repeat(60));
console.log('RESUMEN DE VALIDACIÓN');
console.log('='.repeat(60));
console.log(`Total de pruebas: ${totalTests}`);
console.log(`✅ Payloads válidos: ${passedTests}`);
console.log(`❌ Payloads inválidos: ${failedTests}`);

// Análisis final
console.log('\n' + '='.repeat(60));
console.log('ANÁLISIS FINAL');
console.log('='.repeat(60));

if (failedTests === 0) {
  console.log('✅ Todos los payloads están correctamente formateados.');
  console.log('✅ Cumplen con los requisitos de Datafast.');
  console.log('✅ Están listos para el proceso de certificación.');
  console.log('\n📝 Puedes proceder con confianza a enviar el script a Datafast.');
} else {
  console.log('❌ Algunos payloads tienen problemas.');
  console.log('❌ Revisa los errores antes de enviar a certificación.');
}

console.log('='.repeat(60));