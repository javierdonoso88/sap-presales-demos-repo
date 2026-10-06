namespace sap.presales.demos;

using { cuid, managed } from '@sap/cds/common';

// ─── Value Types ─────────────────────────────────────────────────────────────

type SystemType : String(20) enum {
    SAC        = 'SAC';
    DATASPHERE = 'DATASPHERE';
    BDC        = 'BDC';
    S4HANA     = 'S4HANA';
    BW4HANA    = 'BW4HANA';
    OTHER      = 'OTHER';
}

type SystemLandscape : String(20) enum {
    BDC_GA   = 'BDC_GA';
    GLA26Q2  = 'GLA26Q2';
    SANDBOX  = 'SANDBOX';
    EXTERNAL = 'EXTERNAL';
}

type DemoStatus : String(20) enum {
    DRAFT    = 'DRAFT';
    READY    = 'READY';
    ARCHIVED = 'ARCHIVED';
}

type DemoResult : String(20) enum {
    VERY_INTERESTED = 'VERY_INTERESTED';
    INTERESTED      = 'INTERESTED';
    NEUTRAL         = 'NEUTRAL';
    NOT_INTERESTED  = 'NOT_INTERESTED';
}

// ─── Master Data ─────────────────────────────────────────────────────────────

entity Systems : cuid, managed {
    name        : String(100)     @mandatory;
    type        : SystemType      @mandatory;
    landscape   : SystemLandscape;
    url         : String(255);
    description : String(1000);
    active      : Boolean default true;
}

entity Clients : cuid, managed {
    name     : String(100) @mandatory;
    industry : String(100);
    country  : String(3);
    contact  : String(100);
    email    : String(200);
}

// ─── Core Entity ─────────────────────────────────────────────────────────────

entity Demos : cuid, managed {
    title       : String(200)                    @mandatory @title: 'Título';
    description : String(3000)                   @title: 'Descripción';
    demoDate    : Date                           @title: 'Fecha demo';
    status      : DemoStatus default 'DRAFT'    @title: 'Estado';
    systems     : Composition of many DemoSystems on systems.demo = $self;
    clients     : Composition of many DemoClients on clients.demo = $self;
}

// ─── Association Tables ───────────────────────────────────────────────────────

entity DemoSystems {
    key demo   : Association to Demos;
    key system : Association to Systems;
    notes      : String(500);
}

entity DemoClients {
    key demo         : Association to Demos;
    key client       : Association to Clients;
    presentationDate : Date;
    result           : DemoResult;
    feedback         : String(2000);
}

entity DemoAttachments : cuid, managed {
    demo        : Association to Demos @mandatory;
    filename    : String(255)          @mandatory;
    contentType : String(100);
    size        : Integer64;
    objectKey   : String(500);
}
