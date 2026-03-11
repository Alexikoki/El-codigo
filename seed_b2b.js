const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
const fs = require('fs')

// Cargar variables de entorno manualmente desde .env.local
const envContent = fs.readFileSync('.env.local', 'utf8')
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([^=]+)\s*=\s*(.*)\s*$/)
    if (match) {
        const key = match[1].trim()
        let val = match[2].trim()
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1)
        process.env[key] = val
    }
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function runSeed() {
    console.log("🚀 Iniciando Inyección de Datos de Prueba B2B...\n")

    const password_hash = await bcrypt.hash("123456", 12)

    // 1. Crear Agencia de Prueba
    console.log("1️⃣  Creando Tour Operator (Agencia)...")
    const { data: agencia, error: errAgencia } = await supabaseAdmin
        .from('agencias')
        .insert({
            nombre: "Ibiza Summer Tours",
            email: "agencia@test.com",
            password_hash: password_hash,
            porcentaje_split: 30.00
        })
        .select().single()

    if (errAgencia) {
        if (errAgencia.code === '23505') console.log("   ⚠️ La agencia de prueba ya existe. Saltando...")
        else throw errAgencia
    } else {
        console.log(`   ✅ Agencia creada: ${agencia?.nombre} (agencia@test.com / 123456)`)
    }

    // 2. Obtener un Lugar existente
    const { data: lugares, error: errLugares } = await supabaseAdmin.from('lugares').select('id, nombre').limit(1)
    if (errLugares || lugares.length === 0) {
        console.error("   ❌ No hay lugares (bares/discotecas) en la BD para asignar a un Manager.")
        process.exit(1)
    }
    const lugar = lugares[0]

    // 3. Crear Manager para el Lugar
    console.log(`\n2️⃣  Creando Manager de Local para: ${lugar.nombre}...`)
    const { data: manager, error: errManager } = await supabaseAdmin
        .from('managers_locales')
        .insert({
            nombre: "Dueño de " + lugar.nombre,
            email: "manager@test.com",
            password_hash: password_hash,
            lugar_id: lugar.id
        })
        .select().single()

    if (errManager) {
        if (errManager.code === '23505') console.log("   ⚠️ El manager de prueba ya existe. Saltando...")
        else throw errManager
    } else {
        console.log(`   ✅ Manager creado para ${lugar.nombre}: manager@test.com / 123456`)
    }

    console.log("\n🎉 SEED COMPLETADO SATISFACTORIAMENTE")
    console.log("====================================================")
    console.log("DATOS PARA INGRESO EN TU PC: http://localhost:3000/login")
    console.log("Pestaña Agencia : agencia@test.com / 123456")
    console.log("Pestaña Club    : manager@test.com / 123456")
    console.log("====================================================\n")
}

runSeed().catch(console.error)
