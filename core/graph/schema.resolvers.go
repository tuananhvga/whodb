package graph

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.
// Code generated by github.com/99designs/gqlgen version v0.17.48

import (
	"context"
	"errors"

	"github.com/clidey/whodb/core/graph/model"
	"github.com/clidey/whodb/core/src"
	"github.com/clidey/whodb/core/src/auth"
	"github.com/clidey/whodb/core/src/engine"
)

// Login is the resolver for the Login field.
func (r *mutationResolver) Login(ctx context.Context, credentials model.LoginCredentials) (*model.StatusResponse, error) {
	advanced := []engine.Record{}
	for _, recordInput := range credentials.Advanced {
		advanced = append(advanced, engine.Record{
			Key:   recordInput.Key,
			Value: recordInput.Value,
		})
	}
	if !src.MainEngine.Choose(engine.DatabaseType(credentials.Type)).IsAvailable(&engine.PluginConfig{
		Credentials: &engine.Credentials{
			Hostname: credentials.Hostname,
			Username: credentials.Username,
			Password: credentials.Password,
			Database: credentials.Database,
			Advanced: advanced,
		},
	}) {
		return nil, errors.New("unauthorized")
	}
	return auth.Login(ctx, &credentials)
}

// Logout is the resolver for the Logout field.
func (r *mutationResolver) Logout(ctx context.Context) (*model.StatusResponse, error) {
	return auth.Logout(ctx)
}

// UpdateStorageUnit is the resolver for the UpdateStorageUnit field.
func (r *mutationResolver) UpdateStorageUnit(ctx context.Context, typeArg model.DatabaseType, schema string, storageUnit string, values []*model.RecordInput) (*model.StatusResponse, error) {
	config := engine.NewPluginConfig(auth.GetCredentials(ctx))
	valuesMap := map[string]string{}
	for _, value := range values {
		valuesMap[value.Key] = value.Value
	}
	status, err := src.MainEngine.Choose(engine.DatabaseType(typeArg)).UpdateStorageUnit(config, schema, storageUnit, valuesMap)
	if err != nil {
		return nil, err
	}
	return &model.StatusResponse{
		Status: status,
	}, nil
}

// Database is the resolver for the Database field.
func (r *queryResolver) Database(ctx context.Context, typeArg model.DatabaseType) ([]string, error) {
	return src.MainEngine.Choose(engine.DatabaseType(typeArg)).GetDatabases()
}

// Schema is the resolver for the Schema field.
func (r *queryResolver) Schema(ctx context.Context, typeArg model.DatabaseType) ([]string, error) {
	config := engine.NewPluginConfig(auth.GetCredentials(ctx))
	return src.MainEngine.Choose(engine.DatabaseType(typeArg)).GetSchema(config)
}

// StorageUnit is the resolver for the StorageUnit field.
func (r *queryResolver) StorageUnit(ctx context.Context, typeArg model.DatabaseType, schema string) ([]*model.StorageUnit, error) {
	config := engine.NewPluginConfig(auth.GetCredentials(ctx))
	units, err := src.MainEngine.Choose(engine.DatabaseType(typeArg)).GetStorageUnits(config, schema)
	if err != nil {
		return nil, err
	}
	storageUnits := []*model.StorageUnit{}
	for _, unit := range units {
		storageUnits = append(storageUnits, engine.GetStorageUnitModel(unit))
	}
	return storageUnits, nil
}

// Row is the resolver for the Row field.
func (r *queryResolver) Row(ctx context.Context, typeArg model.DatabaseType, schema string, storageUnit string, where string, pageSize int, pageOffset int) (*model.RowsResult, error) {
	config := engine.NewPluginConfig(auth.GetCredentials(ctx))
	rowsResult, err := src.MainEngine.Choose(engine.DatabaseType(typeArg)).GetRows(config, schema, storageUnit, where, pageSize, pageOffset)
	if err != nil {
		return nil, err
	}
	columns := []*model.Column{}
	for _, column := range rowsResult.Columns {
		columns = append(columns, &model.Column{
			Type: column.Type,
			Name: column.Name,
		})
	}
	return &model.RowsResult{
		Columns:       columns,
		Rows:          rowsResult.Rows,
		DisableUpdate: rowsResult.DisableUpdate,
	}, nil
}

// RawExecute is the resolver for the RawExecute field.
func (r *queryResolver) RawExecute(ctx context.Context, typeArg model.DatabaseType, query string) (*model.RowsResult, error) {
	config := engine.NewPluginConfig(auth.GetCredentials(ctx))
	rowsResult, err := src.MainEngine.Choose(engine.DatabaseType(typeArg)).RawExecute(config, query)
	if err != nil {
		return nil, err
	}
	columns := []*model.Column{}
	for _, column := range rowsResult.Columns {
		columns = append(columns, &model.Column{
			Type: column.Type,
			Name: column.Name,
		})
	}
	return &model.RowsResult{
		Columns: columns,
		Rows:    rowsResult.Rows,
	}, nil
}

// Graph is the resolver for the Graph field.
func (r *queryResolver) Graph(ctx context.Context, typeArg model.DatabaseType, schema string) ([]*model.GraphUnit, error) {
	config := engine.NewPluginConfig(auth.GetCredentials(ctx))
	graphUnits, err := src.MainEngine.Choose(engine.DatabaseType(typeArg)).GetGraph(config, schema)
	if err != nil {
		return nil, err
	}
	graphUnitsModel := []*model.GraphUnit{}
	for _, graphUnit := range graphUnits {
		relations := []*model.GraphUnitRelationship{}
		for _, relation := range graphUnit.Relations {
			relations = append(relations, &model.GraphUnitRelationship{
				Name:         relation.Name,
				Relationship: model.GraphUnitRelationshipType(relation.RelationshipType),
			})
		}
		graphUnitsModel = append(graphUnitsModel, &model.GraphUnit{
			Unit:      engine.GetStorageUnitModel(graphUnit.Unit),
			Relations: relations,
		})
	}
	return graphUnitsModel, nil
}

// Mutation returns MutationResolver implementation.
func (r *Resolver) Mutation() MutationResolver { return &mutationResolver{r} }

// Query returns QueryResolver implementation.
func (r *Resolver) Query() QueryResolver { return &queryResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
