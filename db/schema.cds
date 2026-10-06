namespace sap.presales.demos;
using { cuid } from '@sap/cds/common';

// Managed timestamps/user aspect using UPPERCASE column names
// (matches existing HANA table columns — no migration needed)
aspect managed_uc {
  CREATEDAT  : Timestamp @cds.on.insert: $now;
  CREATEDBY  : String(255) @cds.on.insert: $user;
  MODIFIEDAT : Timestamp @cds.on.insert: $now @cds.on.update: $now;
  MODIFIEDBY : String(255) @cds.on.insert: $user @cds.on.update: $user;
}

// ─── Master Data ─────────────────────────────────────────────────────────────

entity Systems : cuid, managed_uc {
  NAME        : String(100);
  TYPE        : String(20);
  LANDSCAPE   : String(20);
  URL         : String(255);
  DESCRIPTION : String(1000);
  ACTIVE      : Boolean default true;
}

entity Clients : cuid, managed_uc {
  NAME     : String(100);
  INDUSTRY : String(100);
  COUNTRY  : String(3);
  CONTACT  : String(100);
  EMAIL    : String(200);
}

// ─── Core Entity ─────────────────────────────────────────────────────────────

entity Demos : cuid, managed_uc {
  TITLE       : String(200);
  DESCRIPTION : String(3000);
  DEMODATE    : Date;
  STATUS      : String(20) default 'DRAFT';
  TAGS        : String(500);
}

// ─── Association / Junction Tables ───────────────────────────────────────────

entity DemoSystems {
  key DEMO_ID   : UUID;
  key SYSTEM_ID : UUID;
  NOTES         : String(500);
}

entity DemoClients {
  key DEMO_ID          : UUID;
  key CLIENT_ID        : UUID;
  PRESENTATIONDATE     : Date;
  RESULT               : String(20);
  FEEDBACK             : String(2000);
}

entity DemoAttachments : cuid, managed_uc {
  DEMO_ID     : UUID;
  FILENAME    : String(255);
  CONTENTTYPE : String(100);
  SIZE        : Integer64;
  OBJECTKEY   : String(500);
}

// ─── History & Share ──────────────────────────────────────────────────────────

entity DemoHistory : cuid {
  DEMO_ID   : UUID;
  CHANGEDAT : Timestamp;
  CHANGEDBY : String(255);
  FIELD     : String(100);
  OLDVALUE  : String(2000);
  NEWVALUE  : String(2000);
}

entity ShareTokens {
  key TOKEN    : UUID;
  DEMO_ID      : UUID;
  CREATEDAT    : Timestamp;
  CREATEDBY    : String(255);
  EXPIRESAT    : Timestamp;
}
