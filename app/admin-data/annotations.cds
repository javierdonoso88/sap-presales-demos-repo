using AdminService from '../../srv/admin-service';

// ─── Tenants ──────────────────────────────────────────────────────────────────

annotate AdminService.Tenants with @(
    UI.HeaderInfo: {
        TypeName      : 'Sistema Tenant',
        TypeNamePlural: 'Sistemas Tenant',
        Title         : { Value: name },
        Description   : { Value: type }
    },
    UI.LineItem: [
        { Value: name,        Label: 'Nombre'   },
        { Value: type,        Label: 'Tipo'     },
        { Value: url,         Label: 'URL'      },
        { Value: active,      Label: 'Activo'   },
        { Value: description, Label: 'Descripción' }
    ],
    UI.FieldGroup #TenantDetail: {
        Label: 'Detalle del Tenant',
        Data: [
            { Value: name,        Label: 'Nombre'      },
            { Value: type,        Label: 'Tipo'        },
            { Value: url,         Label: 'URL'         },
            { Value: active,      Label: 'Activo'      },
            { Value: description, Label: 'Descripción' }
        ]
    },
    UI.Facets: [
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Información',
            ID    : 'TenantInfo',
            Target: '@UI.FieldGroup#TenantDetail'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Objetos en este tenant',
            ID    : 'TenantObjects',
            Target: 'objects/@UI.LineItem'
        }
    ]
);

// ─── Solutions ────────────────────────────────────────────────────────────────

annotate AdminService.Solutions with @(
    UI.HeaderInfo: {
        TypeName      : 'Solución',
        TypeNamePlural: 'Soluciones',
        Title         : { Value: name },
        Description   : { Value: area }
    },
    UI.LineItem: [
        { Value: name,        Label: 'Solución'     },
        { Value: area,        Label: 'Área'         },
        { Value: description, Label: 'Descripción'  }
    ],
    UI.FieldGroup #SolutionDetail: {
        Label: 'Detalle de la Solución',
        Data: [
            { Value: name,        Label: 'Nombre'      },
            { Value: area,        Label: 'Área'        },
            { Value: description, Label: 'Descripción' }
        ]
    },
    UI.Facets: [
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Información',
            ID    : 'SolutionInfo',
            Target: '@UI.FieldGroup#SolutionDetail'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Objetos de esta solución',
            ID    : 'SolutionObjects',
            Target: 'objects/@UI.LineItem'
        }
    ]
);

// ─── Clients ──────────────────────────────────────────────────────────────────

annotate AdminService.Clients with @(
    UI.HeaderInfo: {
        TypeName      : 'Cliente',
        TypeNamePlural: 'Clientes',
        Title         : { Value: name },
        Description   : { Value: industry }
    },
    UI.LineItem: [
        { Value: name,     Label: 'Empresa'  },
        { Value: industry, Label: 'Sector'   },
        { Value: country,  Label: 'País'     },
        { Value: contact,  Label: 'Contacto' },
        { Value: email,    Label: 'Email'    }
    ],
    UI.FieldGroup #ClientDetail: {
        Label: 'Detalle del Cliente',
        Data: [
            { Value: name,     Label: 'Empresa'  },
            { Value: industry, Label: 'Sector'   },
            { Value: country,  Label: 'País'     },
            { Value: contact,  Label: 'Contacto' },
            { Value: email,    Label: 'Email'    }
        ]
    },
    UI.Facets: [{
        $Type : 'UI.ReferenceFacet',
        Label : 'Información',
        ID    : 'ClientInfo',
        Target: '@UI.FieldGroup#ClientDetail'
    }]
);

// ─── ComponentObjects ─────────────────────────────────────────────────────────

annotate AdminService.ComponentObjects with @(
    UI.HeaderInfo: {
        TypeName      : 'Objeto',
        TypeNamePlural: 'Objetos',
        Title         : { Value: name },
        Description   : { Value: objectType }
    },
    UI.SelectionFields: [ objectType, tenant_ID, solution_ID, active ],
    UI.LineItem: [
        { Value: name,             Label: 'Nombre'    },
        { Value: objectType,       Label: 'Tipo'      },
        { Value: tenant.name,      Label: 'Tenant'    },
        { Value: solution.name,    Label: 'Solución'  },
        { Value: active,           Label: 'Activo'    }
    ],
    UI.FieldGroup #ObjectDetail: {
        Label: 'Detalle del Objeto',
        Data: [
            { Value: name,        Label: 'Nombre'      },
            { Value: objectType,  Label: 'Tipo'        },
            { Value: tenant_ID,   Label: 'Tenant'      },
            { Value: solution_ID, Label: 'Solución'    },
            { Value: path,        Label: 'Ruta / URL'  },
            { Value: active,      Label: 'Activo'      },
            { Value: description, Label: 'Descripción' }
        ]
    },
    UI.Facets: [{
        $Type : 'UI.ReferenceFacet',
        Label : 'Información',
        ID    : 'ObjectInfo',
        Target: '@UI.FieldGroup#ObjectDetail'
    }]
);

annotate AdminService.ComponentObjects with {
    tenant @(
        Common.Text           : tenant.name,
        Common.TextArrangement: #TextOnly,
        Common.ValueList: {
            CollectionPath: 'Tenants',
            Parameters: [
                { $Type: 'Common.ValueListParameterOut',         LocalDataProperty: tenant_ID,  ValueListProperty: 'ID'   },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'type' }
            ]
        }
    );
    solution @(
        Common.Text           : solution.name,
        Common.TextArrangement: #TextOnly,
        Common.ValueList: {
            CollectionPath: 'Solutions',
            Parameters: [
                { $Type: 'Common.ValueListParameterOut',         LocalDataProperty: solution_ID, ValueListProperty: 'ID'   },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'area' }
            ]
        }
    );
    objectType @Common.ValueListWithFixedValues: true;
}

// ─── Objects subsection en Tenants/Solutions ──────────────────────────────────

annotate AdminService.Tenants:objects with @(
    UI.LineItem: [
        { Value: name,       Label: 'Objeto'    },
        { Value: objectType, Label: 'Tipo'      },
        { Value: solution.name, Label: 'Solución' },
        { Value: active,     Label: 'Activo'    }
    ]
);

annotate AdminService.Solutions:objects with @(
    UI.LineItem: [
        { Value: name,       Label: 'Objeto'    },
        { Value: objectType, Label: 'Tipo'      },
        { Value: tenant.name, Label: 'Tenant'   },
        { Value: active,     Label: 'Activo'    }
    ]
);
