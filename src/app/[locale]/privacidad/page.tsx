import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de privacidad — QuieroBCN',
}

export default function PrivacidadPage() {
  const lastUpdated = '8 de marzo de 2026'

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 py-3">
        <div className="mx-auto max-w-3xl">
          <span className="font-display font-bold text-primary">QuieroBCN</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <article className="prose prose-sm max-w-none text-foreground">
          <h1 className="font-display text-3xl font-bold mb-2">Política de privacidad</h1>
          <p className="text-sm text-muted-foreground mb-8">Última actualización: {lastUpdated}</p>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">1. Responsable del tratamiento</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              El responsable del tratamiento de los datos personales recogidos a través de esta
              plataforma es el agente inmobiliario operador de QuieroBCN. Para cualquier consulta
              relacionada con el tratamiento de tus datos, puedes contactar a través del email
              facilitado durante el proceso de registro.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">2. Datos personales que tratamos</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              En el marco de la búsqueda de vivienda en Barcelona, tratamos los siguientes datos:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Datos de contacto: nombre, teléfono y correo electrónico</li>
              <li>Documento de identidad: DNI, NIE o pasaporte</li>
              <li>Documentación económica: nóminas, contratos de trabajo, declaración de la renta, extractos bancarios, recibos de autónomos</li>
              <li>Situación laboral y financiera: tipo de perfil, ingresos mensuales</li>
              <li>Preferencias de búsqueda: barrios, presupuesto, fecha de entrada, mascotas</li>
              <li>Datos técnicos: dirección IP y datos de sesión (seguridad)</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">3. Finalidad y base jurídica</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Los datos son tratados con la finalidad de gestionar tu búsqueda de vivienda de
              alquiler en Barcelona, incluyendo:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Verificar tu solvencia económica para presentar candidaturas ante promotoras inmobiliarias</li>
              <li>Emparejarte con pisos que se ajusten a tu perfil y preferencias</li>
              <li>Gestionar la reserva de visitas a inmuebles</li>
              <li>Enviar notificaciones sobre nuevas oportunidades de vivienda</li>
            </ul>
            <p className="text-sm leading-relaxed text-muted-foreground">
              La base jurídica del tratamiento es el artículo 6(1)(b) del RGPD (ejecución de un
              contrato o medidas precontractuales), complementada con el consentimiento explícito
              del usuario (art. 6(1)(a)) para el tratamiento de documentos sensibles.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">4. Destinatarios de los datos</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Tus datos y documentos únicamente serán compartidos con promotoras o empresas
              inmobiliarias en los casos en que:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Hayas sido emparejado con un inmueble específico</li>
              <li>Hayas reservado y confirmado una visita</li>
              <li>El agente realice la presentación de tu candidatura de forma manual</li>
            </ul>
            <p className="text-sm leading-relaxed text-muted-foreground">
              En ningún caso se cederán datos a terceros con fines comerciales ni publicitarios.
              La plataforma utiliza Supabase (con servidores en la Unión Europea) como
              infraestructura de almacenamiento, con la que existe un Acuerdo de Tratamiento
              de Datos (DPA) vigente.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">5. Conservación de los datos</h2>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Los datos se conservarán durante el tiempo necesario para la prestación del servicio:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Hasta que solicites la eliminación de tu cuenta</li>
                <li>O hasta 3 años desde la última actividad en la plataforma</li>
              </ul>
              <p>
                Los documentos eliminados se marcan como suprimidos y los ficheros se borran
                de los servidores de almacenamiento. Se conserva un registro mínimo de auditoría
                sin datos personales.
              </p>
            </div>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">6. Tus derechos (RGPD)</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Tienes derecho a:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Acceso</strong> — conocer qué datos tratamos sobre ti</li>
              <li><strong>Rectificación</strong> — corregir datos inexactos</li>
              <li><strong>Supresión (derecho al olvido)</strong> — solicitar la eliminación de todos tus datos</li>
              <li><strong>Portabilidad</strong> — recibir tus datos en formato estructurado</li>
              <li><strong>Oposición</strong> — oponerte al tratamiento en determinadas circunstancias</li>
              <li><strong>Limitación</strong> — solicitar la restricción del tratamiento</li>
            </ul>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Para ejercer cualquiera de estos derechos, puedes utilizar el botón "Eliminar mi
              cuenta" en la sección de perfil de la plataforma, o contactar directamente con el
              agente por email. Responderemos en un plazo máximo de <strong>30 días</strong>{' '}
              (art. 12 RGPD).
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Si consideras que el tratamiento no es conforme al RGPD, tienes derecho a
              presentar una reclamación ante la{' '}
              <strong>Agencia Española de Protección de Datos (AEPD)</strong> — www.aepd.es.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">7. Seguridad</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Aplicamos medidas técnicas y organizativas para proteger tus datos:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Cifrado en tránsito (TLS) y en reposo</li>
              <li>Acceso a documentos únicamente mediante URLs temporales de acceso firmado (máx. 1 hora)</li>
              <li>Control de acceso por filas (Row Level Security) en la base de datos</li>
              <li>Registro de auditoría de cada acceso a documentos por parte del agente</li>
              <li>Ningún fichero se escribe en disco del servidor — subida directa a almacenamiento cifrado</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">8. Contacto</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Para cualquier consulta sobre esta política o el tratamiento de tus datos, contacta
              con el agente a través del correo electrónico facilitado al registrarte en la
              plataforma.
            </p>
          </section>
        </article>
      </main>
    </div>
  )
}
