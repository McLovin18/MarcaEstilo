"use client";
import React, { useEffect, useRef } from "react";
import Link from "next/link";

const sections = [
  {
    number: "01",
    title: "Información personal que recopilamos",
    body: "Podemos recopilar o tratar las siguientes categorías de información personal según cómo interactúe con los Servicios: detalles de contacto (nombre, dirección, teléfono, correo electrónico); información financiera (tarjetas de pago, datos de transacciones); información de cuenta (usuario, contraseña, preferencias); información sobre transacciones (artículos consultados, comprados, devueltos o cancelados); comunicaciones con nosotros; información del dispositivo (IP, navegador, identificadores únicos); e información sobre el uso de los Servicios.",
  },
  {
    number: "02",
    title: "Fuentes de información personal",
    body: "Recopilamos información personal de las siguientes fuentes: directamente de usted al crear una cuenta, visitar o utilizar los Servicios, o comunicarse con nosotros; automáticamente a través de los Servicios mediante cookies y tecnologías similares; de nuestros proveedores de servicios que recopilan o tratan información en nuestro nombre; y de nuestros partners o de otros terceros.",
  },
  {
    number: "03",
    title: "Cómo utilizamos su información personal",
    body: "Utilizamos su información para: prestar, personalizar y mejorar los Servicios (procesar pagos, gestionar pedidos, organizar envíos, recordar preferencias y ofrecer recomendaciones personalizadas); marketing y publicidad (comunicaciones promocionales por correo, SMS o correo postal, y anuncios en línea basados en su actividad); seguridad y prevención de fraudes (autenticar cuentas y detectar actividades fraudulentas o maliciosas); comunicaciones con usted (atención al cliente y respuesta a solicitudes); y cumplimiento de obligaciones legales (responder a procedimientos legales, hacer cumplir términos y políticas).",
  },
  {
    number: "04",
    title: "Cómo divulgamos la información personal",
    body: "Podemos divulgar su información personal a: proveedores de servicios que actúan en nuestro nombre (gestión de TI, procesamiento de pagos, análisis de datos, atención al cliente, almacenamiento en la nube, gestión de pedidos y envíos); partners comerciales y de marketing para publicidad personalizada; terceros con su consentimiento (por ejemplo, para envíos o integraciones de redes sociales); afiliados dentro de nuestro grupo empresarial; y en el marco de transacciones comerciales (fusiones, procesos de insolvencia) u obligaciones legales.",
  },
  {
    number: "05",
    title: "Sitios web y enlaces de terceros",
    body: "Los Servicios pueden incluir enlaces a sitios web u otras plataformas en línea gestionadas por terceros. No garantizamos ni nos hacemos responsables de la privacidad o la seguridad de dichos sitios. La información que proporcione en espacios públicos o plataformas de redes sociales de terceros también puede ser visible para otros usuarios sin limitaciones por nuestra parte.",
  },
  {
    number: "06",
    title: "Datos de menores",
    body: "Los Servicios no están destinados a ser utilizados por menores. No recopilamos conscientemente información personal de menores de edad según la legislación aplicable en su jurisdicción. Si usted es padre, madre o tutor legal de un menor que nos haya facilitado su información personal, puede contactarnos para solicitar su eliminación. No compartimos ni vendemos información personal de personas menores de 16 años.",
  },
  {
    number: "07",
    title: "Seguridad y retención de su información",
    body: "Ninguna medida de seguridad es perfecta o infalible, y no podemos garantizar una seguridad absoluta. Le recomendamos que no utilice canales no seguros para enviarnos información sensible o confidencial. El tiempo durante el cual conservamos su información personal depende de factores como la necesidad de mantener su cuenta, prestar los Servicios, cumplir obligaciones legales, resolver conflictos o hacer cumplir contratos y políticas aplicables.",
  },
  {
    number: "08",
    title: "Sus derechos y opciones",
    body: "Según el lugar en el que resida, puede tener los siguientes derechos sobre su información personal: derecho de acceso, derecho de supresión, derecho de rectificación, derecho a la portabilidad de los datos, y gestión de preferencias de comunicación (puede cancelar la suscripción a correos promocionales en cualquier momento mediante la opción incluida en dichos correos). No le discriminaremos por ejercer ninguno de estos derechos. Puede ejercerlos poniéndose en contacto con nosotros a través de los datos indicados más abajo.",
  },
  {
    number: "09",
    title: "Reclamaciones",
    body: "Si tiene alguna reclamación sobre cómo tratamos su información personal, le rogamos que se ponga en contacto con nosotros a través de los detalles de contacto que se indican más abajo. Según el lugar en el que resida, puede tener derecho a presentar una reclamación ante la autoridad local de protección de datos.",
  },
  {
    number: "10",
    title: "Transferencias internacionales",
    body: "Su información personal puede transferirse, almacenarse y tratarse fuera del país en el que reside. Si transferimos su información personal fuera del Espacio Económico Europeo (EEA) o del Reino Unido, utilizaremos mecanismos de transferencia reconocidos, como las cláusulas contractuales estándar (SCC) de la Comisión Europea o cualquier contrato equivalente emitido por la autoridad competente del Reino Unido, según corresponda.",
  },
  {
    number: "11",
    title: "Cambios en esta política",
    body: "Podemos actualizar esta Política de privacidad ocasionalmente, incluso para reflejar cambios en nuestras prácticas o por motivos operativos, legales o normativos. Publicaremos la versión actualizada en este sitio web, actualizaremos la fecha de última actualización y notificaremos los cambios conforme a lo exigido por la legislación aplicable.",
  },
  {
    number: "12",
    title: "Contacto",
    body: null,
    isContact: true,
  },
];

const PoliticaPrivacidad: React.FC = () => {
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!lineRef.current) return;
      const el = lineRef.current;
      const rect = el.getBoundingClientRect();
      const windowH = window.innerHeight;

      const progress = Math.min(
        Math.max((windowH - rect.top) / (rect.height + windowH), 0),
        1
      );

      el.style.setProperty("--progress", String(progress));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        @keyframes tc-fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .tc-section {
          animation: tc-fade-in 0.5s ease both;
        }

        .tc-line {
          position: absolute;
          left: 47px;
          top: 72px;
          bottom: 100px;
          width: 1px;
        }

        .tc-line::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          background: linear-gradient(180deg, #7c3aed, #a855f7);
          height: calc(var(--progress, 0) * 100%);
        }

        .dark .tc-card:hover {
          background: linear-gradient(145deg,#181820,#222230) !important;
          border-color: rgba(124,58,237,0.5) !important;
          box-shadow: 
            0 0 0 1px rgba(124,58,237,0.25),
            0 20px 50px rgba(124,58,237,0.15),
            0 10px 30px rgba(0,0,0,0.8);
          transform: translateY(-2px);
        }
      `}</style>

      <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0a0a0d] dark:text-[#e2ddf0]">

        {/* HERO */}
        <div className="relative overflow-hidden px-6 pt-16 pb-10 text-center">

          {/* Glow */}
          <div className="pointer-events-none absolute left-1/2 -top-32 -translate-x-1/2 w-[600px] h-[600px] rounded-full 
          bg-[radial-gradient(circle,rgba(124,58,237,0.15)_0%,transparent_70%)] 
          dark:bg-[radial-gradient(circle,rgba(124,58,237,0.25)_0%,transparent_70%)]" />

          <div className="relative z-10">
            <p className="uppercase tracking-[0.2em] text-sm text-violet-500 mb-4">
              Documento legal
            </p>

            <h1 className="text-3xl sm:text-5xl font-extrabold font-[Syne] mb-4">
              Política de <span className="text-violet-600">Privacidad</span>
            </h1>

            <p className="text-gray-500 dark:text-[#a8a1c4] max-w-xl mx-auto italic">
              En MARCA ESTILO protegemos tu información. Aquí te explicamos cómo recopilamos y utilizamos tus datos.
            </p>

            <p className="text-xs text-gray-400 dark:text-[#6b6485] mt-3">
              Última actualización: 17 de mayo de 2026
            </p>
          </div>
        </div>

        {/* BODY */}
        <div className="relative max-w-4xl mx-auto px-6 pb-20">

          <div
            className="tc-line bg-violet-200 dark:bg-[rgba(124,58,237,0.25)]"
            ref={lineRef}
            style={{ "--progress": "0" } as React.CSSProperties}
          />

          {sections.map((s) =>
            s.isContact ? (
              <div key={s.number} className="tc-section flex gap-6 mb-12">

                <div className="flex-1 flex justify-between items-center bg-violet-50 dark:bg-[#15151a] border dark:border-[rgba(124,58,237,0.25)] rounded-xl p-6">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">
                      Contacto
                    </p>
                    <p className="text-sm text-gray-500 dark:text-[#cfc9e6] py-3">
                      Escríbenos para cualquier consulta sobre privacidad
                    </p>

                    <div className="flex flex-col gap-2">
                      <a
                        href="mailto:estilolibremz@gmail.com"
                        className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm inline-block w-fit"
                      >
                        marcaestilo593@gmail.com
                      </a>

                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div key={s.number} className="tc-section flex gap-6 mb-12">

                <div className="w-10 h-10 flex items-center justify-center rounded-full border text-violet-500">
                  {s.number}
                </div>

                <div className="tc-card flex-1 rounded-2xl px-7 py-6 
                  bg-gray-50 border border-gray-100 
                  dark:bg-[linear-gradient(145deg,#15151a,#1c1c24)] 
                  dark:border-[rgba(124,58,237,0.25)] 
                  dark:shadow-[0_0_0_1px_rgba(124,58,237,0.12),0_20px_40px_rgba(0,0,0,0.6)] 
                  transition-all duration-300">

                  <p className="font-bold mb-2 text-gray-900 dark:text-white">
                    {s.title}
                  </p>

                  <p className="text-sm leading-relaxed text-gray-500 dark:text-[#cfc9e6]">
                    {s.body}
                  </p>
                </div>
              </div>
            )
          )}

          {/* FOOTER */}
          <div className="text-center border-t pt-10 mt-10">
            <p className="text-sm text-gray-400 dark:text-[#7b7396] mb-4">
              Gracias por confiar en MARCA ESTILO. Tu privacidad es importante para nosotros.
            </p>

            <Link href="/" className="text-violet-600 hover:underline">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default PoliticaPrivacidad;