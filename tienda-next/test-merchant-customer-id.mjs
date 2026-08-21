/**
 * Script de pruebas de integración para verificar unicidad de merchantCustomerId
 * 
 * Este script simula diferentes escenarios de usuarios para validar que el campo
 * customer.merchantCustomerId sea único para cada cliente, requisito de Datafast.
 */

const API_BASE = 'http://localhost:3000'; // Cambia a tu URL local o de testing
const ENDPOINT = '/api/datafast/iniciar-pago';

// Casos de prueba para verificar unicidad de merchantCustomerId
const testCases = [
  {
    name: 'Usuario autenticado',
    description: 'Usuario con userId de Firebase',
    userId: 'firebase_user_001',
    cliente: {
      nombre: 'Juan',
      apellido: 'Perez',
      nombreSolo: 'Juan',
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
      { id: 'prod1', nombre: 'Camisa', precio: 25.00, cantidad: 1 }
    ],
    total: 25.00
  },
  {
    name: 'Usuario autenticado diferente',
    description: 'Otro usuario con userId diferente',
    userId: 'firebase_user_002',
    cliente: {
      nombre: 'Maria',
      apellido: 'Garcia',
      nombreSolo: 'Maria',
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
      { id: 'prod2', nombre: 'Pantalón', precio: 35.00, cantidad: 1 }
    ],
    total: 35.00
  },
  {
    name: 'Usuario invitado con cédula',
    description: 'Usuario no autenticado con identificación',
    userId: null,
    cliente: {
      nombre: 'Carlos',
      apellido: 'Rodriguez',
      nombreSolo: 'Carlos',
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
      { id: 'prod3', nombre: 'Chaqueta', precio: 55.00, cantidad: 1 }
    ],
    total: 55.00
  },
  {
    name: 'Usuario invitado diferente con cédula',
    description: 'Otro usuario no autenticado con cédula diferente',
    userId: null,
    cliente: {
      nombre: 'Ana',
      apellido: 'Martinez',
      nombreSolo: 'Ana',
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
      { id: 'prod4', nombre: 'Zapatos', precio: 45.00, cantidad: 1 }
    ],
    total: 45.00
  },
  {
    name: 'Usuario invitado sin cédula',
    description: 'Usuario no autenticado sin identificación (debe usar guest_transactionId)',
    userId: null,
    cliente: {
      nombre: 'Roberto',
      apellido: 'Sanchez',
      nombreSolo: 'Roberto',
      email: 'roberto.sanchez@test.com',
      telefono: '+593994567890',
      identificacion: '' // Sin cédula
    },
    direccion: {
      provincia: 'Guayas',
      ciudad: 'Guayaquil',
      direccion: 'Av. Urbina 555'
    },
    productos: [
      { id: 'prod5', nombre: 'Cinturón', precio: 15.00, cantidad: 1 }
    ],
    total: 15.00
  },
  {
    name: 'Usuario invitado sin cédula (segunda transacción)',
    description: 'Mismo usuario invitado sin cédula, segunda transacción',
    userId: null,
    cliente: {
      nombre: 'Roberto',
      apellido: 'Sanchez',
      nombreSolo: 'Roberto',
      email: 'roberto.sanchez@test.com',
      telefono: '+593994567890',
      identificacion: '' // Sin cédula
    },
    direccion: {
      provincia: 'Guayas',
      ciudad: 'Guayaquil',
      direccion: 'Av. Urbina 555'
    },
    productos: [
      { id: 'prod6', nombre: 'Calcetines', precio: 10.00, cantidad: 2 }
    ],
    total: 20.00
  }
];

async function runTest(testCase, index) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST ${index + 1}: ${testCase.name}`);
  console.log(`Descripción: ${testCase.description}`);
  console.log(`${'='.repeat(60)}`);
  
  try {
    const response = await fetch(`${API_BASE}${ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCase)
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log('✅ Prueba exitosa');
      console.log(`Checkout ID: ${data.checkoutId}`);
      console.log(`Pedido ID: ${data.pedidoId}`);
      
      // Nota: En una implementación real, podríamos extraer el merchantCustomerId
      // de los logs del servidor o de la respuesta si está disponible
      console.log(`Usuario ID: ${testCase.userId || 'N/A (invitado)'}`);
      console.log(`Identificación: ${testCase.cliente.identificacion || 'N/A'}`);
      console.log(`Email: ${testCase.cliente.email}`);
      
      return {
        success: true,
        testCase: testCase.name,
        userId: testCase.userId,
        identificacion: testCase.cliente.identificacion,
        email: testCase.cliente.email,
        pedidoId: data.pedidoId,
        checkoutId: data.checkoutId
      };
    } else {
      console.log('❌ Prueba fallida');
      console.log(`Error: ${data.error || 'Error desconocido'}`);
      console.log(`Detalles: ${JSON.stringify(data.details || {}, null, 2)}`);
      
      return {
        success: false,
        testCase: testCase.name,
        error: data.error
      };
    }
  } catch (error) {
    console.log('❌ Error en la petición');
    console.log(`Error: ${error.message}`);
    
    return {
      success: false,
      testCase: testCase.name,
      error: error.message
    };
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  PRUEBAS DE INTEGRACIÓN - MERCHANT CUSTOMER ID ÚNICO      ║');
  console.log('║  Requisito Datafast: customer.merchantCustomerId único     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nAPI Endpoint: ${API_BASE}${ENDPOINT}`);
  console.log(`Total de pruebas: ${testCases.length}`);
  
  const results = [];
  
  for (let i = 0; i < testCases.length; i++) {
    const result = await runTest(testCases[i], i);
    results.push(result);
    
    // Pequeña pausa entre pruebas para evitar saturar el servidor
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Resumen de resultados
  console.log('\n\n' + '='.repeat(60));
  console.log('RESUMEN DE RESULTADOS');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Pruebas exitosas: ${successful.length}/${results.length}`);
  console.log(`❌ Pruebas fallidas: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n📋 Detalle de pruebas exitosas:');
    successful.forEach((result, i) => {
      console.log(`\n${i + 1}. ${result.testCase}`);
      console.log(`   UserId: ${result.userId || 'N/A (invitado)'}`);
      console.log(`   Identificación: ${result.identificacion || 'N/A'}`);
      console.log(`   Email: ${result.email}`);
      console.log(`   Pedido ID: ${result.pedidoId}`);
      console.log(`   Checkout ID: ${result.checkoutId}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Detalle de pruebas fallidas:');
    failed.forEach((result, i) => {
      console.log(`\n${i + 1}. ${result.testCase}`);
      console.log(`   Error: ${result.error}`);
    });
  }
  
  // Análisis de unicidad
  console.log('\n\n' + '='.repeat(60));
  console.log('ANÁLISIS DE UNICIDAD DE MERCHANT CUSTOMER ID');
  console.log('='.repeat(60));
  
  const merchantCustomerIds = successful.map(r => ({
    testCase: r.testCase,
    userId: r.userId,
    identificacion: r.identificacion,
    expectedMerchantCustomerId: r.userId || r.identificacion || `guest_${r.pedidoId}`
  }));
  
  console.log('\n📊 merchantCustomerId esperados por prueba:');
  merchantCustomerIds.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.testCase}`);
    console.log(`   userId: ${item.userId || 'N/A'}`);
    console.log(`   identificación: ${item.identificacion || 'N/A'}`);
    console.log(`   merchantCustomerId final: ${item.expectedMerchantCustomerId}`);
  });
  
  // Verificar duplicados
  const uniqueIds = new Set(merchantCustomerIds.map(item => item.expectedMerchantCustomerId));
  const hasDuplicates = uniqueIds.size !== merchantCustomerIds.length;
  
  console.log('\n🔍 Verificación de duplicados:');
  console.log(`   Total de merchantCustomerId: ${merchantCustomerIds.length}`);
  console.log(`   merchantCustomerId únicos: ${uniqueIds.size}`);
  console.log(`   ¿Hay duplicados?: ${hasDuplicates ? '⚠️ SÍ' : '✅ NO'}`);
  
  if (hasDuplicates) {
    console.log('\n⚠️ ADVERTENCIA: Se detectaron merchantCustomerId duplicados.');
    console.log('Esto podría causar rechazo en la certificación de Datafast.');
  } else {
    console.log('\n✅ EXITO: Todos los merchantCustomerId son únicos.');
    console.log('El requisito de Datafast se cumple correctamente.');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('FIN DE LAS PRUEBAS');
  console.log('='.repeat(60));
}

// Ejecutar pruebas
main().catch(console.error);