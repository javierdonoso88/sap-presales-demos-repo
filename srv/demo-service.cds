using { sap.presales.demos as db } from '../db/schema';

@protocol: 'rest'
service DemoService @(path: '/api') {

  // Systems — full CRUD managed by CAP
  // Clients, Demos, etc. are handled by custom Express routes
  @path: 'systems'
  entity Systems as projection on db.Systems;
}
