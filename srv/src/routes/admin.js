'use strict';

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');

const router = Router();

// POST /admin/seed — clean + seed demo data (protected by XSUAA auth)
router.post('/seed', async (req, res, next) => {
  try {
    // ── Clean ────────────────────────────────────────────────────────────────
    await query(`DELETE FROM SAP_PRESALES_DEMOS_DEMOHISTORY`);
    await query(`DELETE FROM SAP_PRESALES_DEMOS_SHARETOKENS`);
    await query(`DELETE FROM SAP_PRESALES_DEMOS_DEMOATTACHMENTS`);
    await query(`DELETE FROM SAP_PRESALES_DEMOS_DEMOSYSTEMS`);
    await query(`DELETE FROM SAP_PRESALES_DEMOS_DEMOCLIENTS`);
    await query(`DELETE FROM SAP_PRESALES_DEMOS_DEMOS`);
    await query(`DELETE FROM SAP_PRESALES_DEMOS_SYSTEMS`);
    await query(`DELETE FROM SAP_PRESALES_DEMOS_CLIENTS`);

    const now = new Date().toISOString();
    const by = ['javier.donoso@sap.com', 'ana.garcia@sap.com', 'miguel.torres@sap.com', 'laura.martin@sap.com'];
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // ── Systems ──────────────────────────────────────────────────────────────
    const systems = [
      { name: 'BDC GA Production', type: 'BDC', landscape: 'BDC_GA', url: 'https://bdc-ga.cfapps.eu10.hana.ondemand.com', description: 'Business Data Cloud GA environment', active: true },
      { name: 'SAC Analytics Cloud', type: 'SAC', landscape: 'BDC_GA', url: 'https://sap-analytics-cloud.eu10.hana.ondemand.com', description: 'SAP Analytics Cloud production tenant', active: true },
      { name: 'Datasphere EU10', type: 'DATASPHERE', landscape: 'GLA26Q2', url: 'https://datasphere.cfapps.eu10.hana.ondemand.com', description: 'Datasphere GLA26Q2 tenant', active: true },
      { name: 'BDC Sandbox', type: 'BDC', landscape: 'SANDBOX', url: 'https://bdc-sandbox.cfapps.eu10.hana.ondemand.com', description: 'Sandbox environment for testing', active: true },
      { name: 'S/4HANA Public Cloud', type: 'S4HANA', landscape: 'EXTERNAL', url: 'https://s4hana.example.sap.com', description: 'S/4HANA Public Cloud demo tenant', active: true },
      { name: 'BW/4HANA Demo', type: 'BW4HANA', landscape: 'GLA26Q2', url: 'https://bw4hana-gla.example.sap.com', description: 'BW/4HANA for migration demos', active: true },
      { name: 'Datasphere Sandbox', type: 'DATASPHERE', landscape: 'SANDBOX', url: 'https://datasphere-sandbox.cfapps.eu10.hana.ondemand.com', description: 'Datasphere sandox for POCs', active: true },
      { name: 'SAC Mobile', type: 'SAC', landscape: 'BDC_GA', url: 'https://sac-mobile.eu10.hana.ondemand.com', description: 'SAC with mobile optimized stories', active: true },
    ];

    const sysIds = {};
    for (const s of systems) {
      const id = uuidv4();
      await query(
        `INSERT INTO SAP_PRESALES_DEMOS_SYSTEMS (ID, NAME, TYPE, LANDSCAPE, URL, DESCRIPTION, ACTIVE, CREATEDAT, CREATEDBY, MODIFIEDAT, MODIFIEDBY)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, s.name, s.type, s.landscape, s.url || null, s.description, s.active ? 1 : 0, now, by[0], now, by[0]]
      );
      sysIds[s.name] = id;
    }

    // ── Clients ───────────────────────────────────────────────────────────────
    const clients = [
      { name: 'Repsol', industry: 'Energy', country: 'ES', contact: 'Pedro Alonso', email: 'pedro.alonso@repsol.com' },
      { name: 'Banco Santander', industry: 'Banking', country: 'ES', contact: 'María López', email: 'mlopez@santander.com' },
      { name: 'Telefónica', industry: 'Telecom', country: 'ES', contact: 'Carlos Ruiz', email: 'c.ruiz@telefonica.com' },
      { name: 'BBVA', industry: 'Banking', country: 'ES', contact: 'Elena Fernández', email: 'efernandez@bbva.com' },
      { name: 'Iberdrola', industry: 'Energy', country: 'ES', contact: 'Roberto Sanz', email: 'r.sanz@iberdrola.com' },
      { name: 'Mapfre', industry: 'Insurance', country: 'ES', contact: 'Ana Muñoz', email: 'a.munoz@mapfre.com' },
      { name: 'Inditex', industry: 'Retail', country: 'ES', contact: 'Sofía Castro', email: 's.castro@inditex.com' },
      { name: 'ACS Group', industry: 'Construction', country: 'ES', contact: 'Javier Morales', email: 'jmorales@acs.es' },
      { name: 'CaixaBank', industry: 'Banking', country: 'ES', contact: 'Lucía Herrero', email: 'l.herrero@caixabank.com' },
      { name: 'Acciona', industry: 'Infrastructure', country: 'ES', contact: 'Pablo Navarro', email: 'pnavarro@acciona.com' },
      { name: 'Ferrovial', industry: 'Infrastructure', country: 'ES', contact: 'Isabel Vega', email: 'i.vega@ferrovial.com' },
      { name: 'Meliá Hotels', industry: 'Hospitality', country: 'ES', contact: 'David Romero', email: 'd.romero@melia.com' },
    ];

    const clientIds = {};
    for (const c of clients) {
      const id = uuidv4();
      await query(
        `INSERT INTO SAP_PRESALES_DEMOS_CLIENTS (ID, NAME, INDUSTRY, COUNTRY, CONTACT, EMAIL, CREATEDAT, CREATEDBY, MODIFIEDAT, MODIFIEDBY)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, c.name, c.industry, c.country, c.contact, c.email, now, by[0], now, by[0]]
      );
      clientIds[c.name] = id;
    }

    // ── Demos ─────────────────────────────────────────────────────────────────
    const demos = [
      {
        title: 'BDC Financial Analytics para Banco Santander',
        description: 'Demo completa de Business Data Cloud para el equipo de riesgos financieros. Mostramos integración con S/4HANA, modelos semánticos, y dashboards en tiempo real sobre exposición crediticia y ratios de capital.',
        demoDate: '2026-09-15',
        status: 'READY',
        tags: 'BDC,Finanzas,Riesgos,S4HANA',
        createdBy: by[0],
        createdAt: '2026-09-01T09:00:00.000Z',
        modifiedAt: '2026-09-10T11:00:00.000Z',
        systems: ['BDC GA Production', 'SAC Analytics Cloud'],
        clients: [{ name: 'Banco Santander', date: '2026-09-15', result: 'POSITIVO', feedback: 'Excelente presentación, muy interesados en la integración con S/4HANA' }],
      },
      {
        title: 'SAC Planning para Repsol',
        description: 'Demostración de SAP Analytics Cloud Planning para el proceso de presupuestación de CAPEX. Incluye driver-based planning, simulaciones de escenarios y consolidación multinivel para la división de refinería.',
        demoDate: '2026-10-02',
        status: 'READY',
        tags: 'SAC,Planning,CAPEX,Energía',
        createdBy: by[1],
        createdAt: '2026-09-20T10:00:00.000Z',
        modifiedAt: '2026-10-01T15:00:00.000Z',
        systems: ['SAC Analytics Cloud', 'Datasphere EU10'],
        clients: [
          { name: 'Repsol', date: '2026-10-02', result: 'POSITIVO', feedback: 'El driver-based planning les parece muy útil para su proceso de cierre' },
        ],
      },
      {
        title: 'Datasphere + BDC para Iberdrola',
        description: 'Caso de uso de gestión de activos renovables. Integración de datos de turbinas eólicas, paneles solares y consumo en red eléctrica usando Datasphere como capa semántica y BDC para análisis avanzado.',
        demoDate: '2026-10-10',
        status: 'READY',
        tags: 'Datasphere,BDC,IoT,Energía renovable',
        createdBy: by[0],
        createdAt: '2026-09-25T08:00:00.000Z',
        modifiedAt: '2026-10-08T14:00:00.000Z',
        systems: ['BDC GA Production', 'Datasphere EU10'],
        clients: [
          { name: 'Iberdrola', date: '2026-10-10', result: 'EVALUANDO', feedback: 'Quieren ver un POC con sus datos reales' },
          { name: 'Acciona', date: '2026-10-10', result: 'EVALUANDO', feedback: 'Muy interesados, tienen iniciativa similar internamente' },
        ],
      },
      {
        title: 'SAC Mobile Stories para Meliá Hotels',
        description: 'Demo de SAP Analytics Cloud stories optimizadas para móvil. KPIs de revenue management, ocupación por propiedad, benchmarking entre hoteles y alertas sobre RevPAR. Enfocado en el director de Revenue.',
        demoDate: '2026-09-28',
        status: 'READY',
        tags: 'SAC,Mobile,Hospitality,Revenue',
        createdBy: by[2],
        createdAt: '2026-09-18T11:00:00.000Z',
        modifiedAt: '2026-09-27T16:00:00.000Z',
        systems: ['SAC Mobile', 'SAC Analytics Cloud'],
        clients: [
          { name: 'Meliá Hotels', date: '2026-09-28', result: 'POSITIVO', feedback: 'El director de Revenue quedó muy satisfecho con la vista móvil' },
        ],
      },
      {
        title: 'BDC Retail Analytics para Inditex',
        description: 'Analytics para cadena de retail. Análisis de ventas por canal, inventario en tienda vs online, predicción de demanda por temporada y análisis de devoluciones. Integración con su ERP SAP.',
        demoDate: '2026-10-05',
        status: 'READY',
        tags: 'BDC,Retail,Predicción,Inventario',
        createdBy: by[3],
        createdAt: '2026-09-22T09:30:00.000Z',
        modifiedAt: '2026-10-04T17:00:00.000Z',
        systems: ['BDC GA Production', 'SAC Analytics Cloud'],
        clients: [
          { name: 'Inditex', date: '2026-10-05', result: 'EN PROCESO', feedback: 'Muy interesados, proceso de compra activo' },
        ],
      },
      {
        title: 'SAC for Insurance - Mapfre',
        description: 'Demostración de analytics para sector seguros. Análisis de siniestralidad por ramo, combined ratio, reservas técnicas y proyecciones actuariales. Dashboard ejecutivo con alertas automáticas.',
        demoDate: '2026-09-20',
        status: 'READY',
        tags: 'SAC,Seguros,Actuarial,KPIs',
        createdBy: by[1],
        createdAt: '2026-09-10T10:00:00.000Z',
        modifiedAt: '2026-09-19T18:00:00.000Z',
        systems: ['SAC Analytics Cloud'],
        clients: [
          { name: 'Mapfre', date: '2026-09-20', result: 'POSITIVO', feedback: 'Excelente cobertura de sus KPIs actuariales' },
        ],
      },
      {
        title: 'BW/4HANA Migration Demo - BBVA',
        description: 'Demo de escenario de migración de BW legacy a BW/4HANA. Mostramos el toolkit de migración, simplificación del modelo de datos, mejora de rendimiento y compatibilidad con herramientas legacy.',
        demoDate: '2026-10-12',
        status: 'READY',
        tags: 'BW4HANA,Migración,Banking,Modernización',
        createdBy: by[0],
        createdAt: '2026-09-30T09:00:00.000Z',
        modifiedAt: '2026-10-11T12:00:00.000Z',
        systems: ['BW/4HANA Demo', 'S/4HANA Public Cloud'],
        clients: [
          { name: 'BBVA', date: '2026-10-12', result: 'EVALUANDO', feedback: 'Tienen un proyecto de modernización aprobado para 2027' },
          { name: 'CaixaBank', date: '2026-10-12', result: 'INTERESADO', feedback: 'Quieren referencias de otras entidades financieras' },
        ],
      },
      {
        title: 'Datasphere Data Products para Telefónica',
        description: 'SAP Datasphere como plataforma de data products. Caso de uso: monetización de datos de red para análisis de cobertura, churn prediction y segmentación de clientes. Data Marketplace interno.',
        demoDate: '2026-10-08',
        status: 'READY',
        tags: 'Datasphere,DataProducts,Telecom,IA',
        createdBy: by[2],
        createdAt: '2026-09-28T14:00:00.000Z',
        modifiedAt: '2026-10-07T10:00:00.000Z',
        systems: ['Datasphere EU10', 'BDC GA Production'],
        clients: [
          { name: 'Telefónica', date: '2026-10-08', result: 'POSITIVO', feedback: 'Muy alineado con su estrategia de data mesh' },
        ],
      },
      {
        title: 'BDC Construction Analytics - ACS Group',
        description: 'Analytics para sector construcción e infraestructuras. Control de proyectos, análisis de desviaciones presupuestarias, gestión de subcontratistas y reporting ESG para proyectos de infraestructura.',
        demoDate: '2026-10-20',
        status: 'DRAFT',
        tags: 'BDC,Construcción,Proyectos,ESG',
        createdBy: by[3],
        createdAt: '2026-10-01T08:00:00.000Z',
        modifiedAt: '2026-10-05T11:00:00.000Z',
        systems: ['BDC GA Production'],
        clients: [],
      },
      {
        title: 'SAC Planning - Presupuestación para Ferrovial',
        description: 'Planning integrado para grupo de infraestructuras. Consolidación de presupuestos de divisiones de autopistas, aeropuertos y servicios. Workflow de aprobación y reporting a consejo.',
        demoDate: '2026-10-25',
        status: 'DRAFT',
        tags: 'SAC,Planning,Consolidación,Infraestructura',
        createdBy: by[0],
        createdAt: '2026-10-03T09:00:00.000Z',
        modifiedAt: '2026-10-06T08:00:00.000Z',
        systems: ['SAC Analytics Cloud'],
        clients: [],
      },
      {
        title: 'Datasphere Governance - Sector Bancario',
        description: 'Demostración de capacidades de gobierno del dato: linaje de datos, catálogo semántico, quality rules y data masking para entornos regulados. Alineado con requerimientos de Basilea III.',
        demoDate: null,
        status: 'DRAFT',
        tags: 'Datasphere,Gobernanza,Compliance,Banking',
        createdBy: by[1],
        createdAt: '2026-10-05T10:00:00.000Z',
        modifiedAt: '2026-10-05T10:00:00.000Z',
        systems: ['Datasphere Sandbox'],
        clients: [],
      },
      {
        title: 'BDC para Supply Chain - Sector Energía',
        description: 'Caso de uso de supply chain analytics: análisis de proveedores, gestión de riesgo de suministro, predicción de precios de commodities y optimización de inventarios estratégicos.',
        demoDate: '2026-11-05',
        status: 'DRAFT',
        tags: 'BDC,SupplyChain,Energía,Predicción',
        createdBy: by[2],
        createdAt: '2026-10-04T11:00:00.000Z',
        modifiedAt: '2026-10-06T09:00:00.000Z',
        systems: ['BDC Sandbox', 'BDC GA Production'],
        clients: [],
      },
      {
        title: 'SAC Embedded Analytics para S/4HANA',
        description: 'Embedded analytics en S/4HANA: queries CDS expuestas en SAC, análisis de AR/AP, FI reporting y reconciliación. Sin replica de datos, acceso en tiempo real.',
        demoDate: '2026-09-10',
        status: 'ARCHIVED',
        tags: 'SAC,S4HANA,Embedded,Finance',
        createdBy: by[0],
        createdAt: '2026-08-25T09:00:00.000Z',
        modifiedAt: '2026-09-12T14:00:00.000Z',
        systems: ['SAC Analytics Cloud', 'S/4HANA Public Cloud'],
        clients: [
          { name: 'Banco Santander', date: '2026-09-10', result: 'NO AVANZÓ', feedback: 'Prefirieron explorar primero BDC' },
        ],
      },
      {
        title: 'BW/4HANA Demo Técnica - Arquitectura',
        description: 'Demo técnica para arquitectos IT. Capa de persistencia, LSA++ adaptada a BW/4HANA, integración con HANA Live Views, SAP HANA Native Storage Extension y compresión avanzada.',
        demoDate: '2026-08-20',
        status: 'ARCHIVED',
        tags: 'BW4HANA,Técnico,Arquitectura,HANA',
        createdBy: by[3],
        createdAt: '2026-08-10T10:00:00.000Z',
        modifiedAt: '2026-08-22T16:00:00.000Z',
        systems: ['BW/4HANA Demo'],
        clients: [
          { name: 'BBVA', date: '2026-08-20', result: 'EVALUANDO', feedback: 'Muy técnica, pendiente de decisión del director de arquitectura' },
        ],
      },
      {
        title: 'Datasphere POC - Acciona Energía',
        description: 'Proof of concept con datos reales de Acciona. Integración con su data lake Azure, modelos semánticos de generación eólica y solar, capa de datos para BI existente.',
        demoDate: '2026-10-15',
        status: 'READY',
        tags: 'Datasphere,POC,Azure,Energía',
        createdBy: by[1],
        createdAt: '2026-09-29T09:00:00.000Z',
        modifiedAt: '2026-10-14T17:00:00.000Z',
        systems: ['Datasphere EU10'],
        clients: [
          { name: 'Acciona', date: '2026-10-15', result: 'POSITIVO', feedback: 'El POC fue un éxito, reunión de contratación esta semana' },
        ],
      },
      {
        title: 'SAC HR Analytics - Análisis de Plantilla',
        description: 'Analytics de recursos humanos: análisis de headcount, rotación, skills gap, coste de personal y cumplimiento de diversidad. Integrado con SAP SuccessFactors.',
        demoDate: '2026-10-18',
        status: 'DRAFT',
        tags: 'SAC,RRHH,SuccessFactors,Diversidad',
        createdBy: by[2],
        createdAt: '2026-10-02T10:00:00.000Z',
        modifiedAt: '2026-10-06T08:30:00.000Z',
        systems: ['SAC Analytics Cloud'],
        clients: [],
      },
      {
        title: 'BDC ESG Dashboard - Reporting Sostenibilidad',
        description: 'Demo de reporting ESG con BDC: huella de carbono, consumo energético, métricas sociales y gobierno corporativo. Alineado con CSRD y taxonomía europea.',
        demoDate: '2026-10-22',
        status: 'READY',
        tags: 'BDC,ESG,Sostenibilidad,CSRD',
        createdBy: by[0],
        createdAt: '2026-10-01T14:00:00.000Z',
        modifiedAt: '2026-10-20T11:00:00.000Z',
        systems: ['BDC GA Production', 'SAC Analytics Cloud'],
        clients: [
          { name: 'Iberdrola', date: '2026-10-22', result: 'POSITIVO', feedback: 'Muy alineado con sus compromisos climáticos 2030' },
          { name: 'Ferrovial', date: '2026-10-22', result: 'INTERESADO', feedback: 'Necesitan cumplir CSRD en 2025, urgencia alta' },
        ],
      },
      {
        title: 'SAC Augmented Analytics - Machine Learning',
        description: 'Capacidades de augmented analytics en SAC: predicciones automáticas, análisis de influencia, Smart Discovery y simulaciones what-if con modelos predictivos integrados.',
        demoDate: '2026-09-25',
        status: 'READY',
        tags: 'SAC,IA,MachineLearning,AugmentedAnalytics',
        createdBy: by[3],
        createdAt: '2026-09-15T09:00:00.000Z',
        modifiedAt: '2026-09-24T15:00:00.000Z',
        systems: ['SAC Analytics Cloud', 'Datasphere EU10'],
        clients: [
          { name: 'Telefónica', date: '2026-09-25', result: 'POSITIVO', feedback: 'Las predicciones automáticas son exactamente lo que buscan' },
          { name: 'Repsol', date: '2026-09-25', result: 'EVALUANDO', feedback: 'Quieren explorar modelos de predicción de precios' },
        ],
      },
      {
        title: 'BDC Operaciones - Dashboard Tiempo Real',
        description: 'Analytics operacional en tiempo real con BDC: streaming de eventos, alertas sobre KPIs operacionales, análisis de incidencias y cuadro de mando para COO. Latencia sub-segundo.',
        demoDate: '2026-10-28',
        status: 'DRAFT',
        tags: 'BDC,Tiempo Real,Operaciones,Streaming',
        createdBy: by[1],
        createdAt: '2026-10-05T14:00:00.000Z',
        modifiedAt: '2026-10-06T08:00:00.000Z',
        systems: ['BDC Sandbox'],
        clients: [],
      },
      {
        title: 'Datasphere Business Builder - Democratización',
        description: 'Demo orientada al usuario de negocio. Business Builder de Datasphere: creación de modelos analíticos sin código, exploración autónoma y conexión con herramientas BI externas (PowerBI, Tableau).',
        demoDate: '2026-10-30',
        status: 'DRAFT',
        tags: 'Datasphere,NoCode,Democratización,BusinessUser',
        createdBy: by[2],
        createdAt: '2026-10-06T09:00:00.000Z',
        modifiedAt: '2026-10-06T09:00:00.000Z',
        systems: ['Datasphere Sandbox'],
        clients: [],
      },
    ];

    for (const d of demos) {
      const demoId = uuidv4();
      const createdAt = d.createdAt || now;
      const modifiedAt = d.modifiedAt || now;
      await query(
        `INSERT INTO SAP_PRESALES_DEMOS_DEMOS
         (ID, TITLE, DESCRIPTION, DEMODATE, STATUS, TAGS, CREATEDAT, CREATEDBY, MODIFIEDAT, MODIFIEDBY)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [demoId, d.title, d.description, d.demoDate || null, d.status, d.tags || null,
         createdAt, d.createdBy, modifiedAt, d.createdBy]
      );

      // Link systems
      for (const sysName of (d.systems || [])) {
        if (sysIds[sysName]) {
          await query(
            `INSERT INTO SAP_PRESALES_DEMOS_DEMOSYSTEMS (DEMO_ID, SYSTEM_ID, NOTES)
             VALUES (?, ?, ?)`,
            [demoId, sysIds[sysName], null]
          );
        }
      }

      // Link clients
      for (const cl of (d.clients || [])) {
        if (clientIds[cl.name]) {
          await query(
            `INSERT INTO SAP_PRESALES_DEMOS_DEMOCLIENTS (DEMO_ID, CLIENT_ID, PRESENTATIONDATE, RESULT, FEEDBACK)
             VALUES (?, ?, ?, ?, ?)`,
            [demoId, clientIds[cl.name], cl.date || null, cl.result || null, cl.feedback || null]
          );
        }
      }

      // Add history for READY demos
      if (d.status === 'READY') {
        await query(
          `INSERT INTO SAP_PRESALES_DEMOS_DEMOHISTORY (ID, DEMO_ID, CHANGEDAT, CHANGEDBY, FIELD, OLDVALUE, NEWVALUE)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), demoId, modifiedAt, d.createdBy, 'STATUS', 'DRAFT', 'READY']
        );
      }
    }

    res.json({ data: { ok: true, message: `Seeded ${systems.length} systems, ${clients.length} clients, ${demos.length} demos` } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
