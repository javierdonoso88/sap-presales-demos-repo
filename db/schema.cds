namespace sap.presales.demos;

using { cuid, managed } from '@sap/cds/common';

// ─── Value Types ─────────────────────────────────────────────────────────────

type TenantType : String(20) enum {
    SAC         = 'SAC';
    DATASPHERE  = 'DATASPHERE';
    BDC         = 'BDC';
    BW4HANA     = 'BW4HANA';
    S4HANA      = 'S4HANA';
    OTHER       = 'OTHER';
}

type ObjectType : String(30) enum {
    STORY            = 'STORY';
    ANALYTICAL_MODEL = 'ANALYTICAL_MODEL';
    PLANNING_MODEL   = 'PLANNING_MODEL';
    DATASET          = 'DATASET';
    DATASOURCE       = 'DATASOURCE';
    PERSPECTIVE      = 'PERSPECTIVE';
    DATAFLOW         = 'DATAFLOW';
    OTHER            = 'OTHER';
}

type DemoStatus : String(20) enum {
    DRAFT    = 'DRAFT';
    READY    = 'READY';
    ARCHIVED = 'ARCHIVED';
}

type DemoResult : String(20) enum {
    VERY_INTERESTED  = 'VERY_INTERESTED';
    INTERESTED       = 'INTERESTED';
    NEUTRAL          = 'NEUTRAL';
    NOT_INTERESTED   = 'NOT_INTERESTED';
}

// ─── Master Data ─────────────────────────────────────────────────────────────

/** Tenants internos SAP para preparar demos (SAC, Datasphere, BDC...) */
entity Tenants : cuid, managed {
    name        : String(100) @mandatory;
    type        : TenantType @mandatory;
    url         : String(255);
    description : String(1000);
    active      : Boolean default true;
    objects     : Composition of many ComponentObjects on objects.tenant = $self;
}

/** Soluciones y componentes SAP que se demuestran */
entity Solutions : cuid, managed {
    name        : String(100) @mandatory;
    area        : String(100);
    description : String(500);
    objects     : Composition of many ComponentObjects on objects.solution = $self;
}

/** Clientes / empresas a las que se ha presentado alguna demo */
entity Clients : cuid, managed {
    name     : String(100) @mandatory;
    industry : String(100);
    country  : String(3);
    contact  : String(100);
    email    : String(200);
}

/** Objetos concretos: historias SAC, modelos Datasphere, datasets... */
entity ComponentObjects : cuid, managed {
    name        : String(200) @mandatory;
    objectType  : ObjectType @mandatory;
    tenant      : Association to Tenants @mandatory;
    solution    : Association to Solutions @mandatory;
    path        : String(500);
    description : String(1000);
    active      : Boolean default true;
}

// ─── Core Entity ─────────────────────────────────────────────────────────────

/** Demo – entidad central del repositorio */
entity Demos : cuid, managed {
    title       : String(200) @mandatory @title: 'Título';
    description : String(3000)            @title: 'Descripción';
    demoDate    : Date                    @title: 'Fecha demo';
    status      : DemoStatus default 'DRAFT' @title: 'Estado';
    tenants     : Composition of many DemoTenants   on tenants.demo   = $self;
    solutions   : Composition of many DemoSolutions on solutions.demo = $self;
    objects     : Composition of many DemoObjects   on objects.demo   = $self;
    clients     : Composition of many DemoClients   on clients.demo   = $self;
}

// ─── Composition Tables ───────────────────────────────────────────────────────

entity DemoTenants {
    key demo   : Association to Demos;
    key tenant : Association to Tenants;
    notes      : String(500);
}

entity DemoSolutions {
    key demo     : Association to Demos;
    key solution : Association to Solutions;
    notes        : String(500);
}

entity DemoObjects {
    key demo   : Association to Demos;
    key object : Association to ComponentObjects;
    notes      : String(500);
}

entity DemoClients {
    key demo             : Association to Demos;
    key client           : Association to Clients;
    presentationDate     : Date;
    result               : DemoResult;
    feedback             : String(2000);
}

entity DemoAttachments : cuid, managed {
    demo        : Association to Demos @mandatory;
    filename    : String(255)          @mandatory;
    contentType : String(100);
    size        : Integer64;
    objectKey   : String(500);
}
