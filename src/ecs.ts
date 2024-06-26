type Callback<T> = (e: T) => void;
type Query = { entities: any[], onEntityAdded: Callback<any>[], onEntityRemoved: Callback<any>[], params: string[] };
type System = (deltaTime: number) => void;

export class World<T extends {}> {
    entities: T[] = [];
    onEntityAdded: Callback<T>[] = [];
    onEntityRemoved: Callback<T>[] = [];
    queries: Query[] = [];
    systems: System[] = [];

    /**
     * Adds an entity to the world and notifies all callbacks.
     * @param e - The entity to add.
     * @returns The added entity.
     */
    add<D extends T>(e: D): D & T {
        this.entities.push(e);
        this.onEntityAdded.forEach(cb => cb(e));
        this.updateQueries(e);
        return e;
    }

    /**
     * Removes an entity from the world and notifies all callbacks.
     * @param e - The entity to remove.
     */
    remove(e: T): void {
        this.entities = this.entities.filter(ent => ent !== e);
        this.onEntityRemoved.forEach(cb => cb(e));
        this.updateQueries(e);
    }

    /**
     * Adds a component to an entity and updates queries.
     * @param e - The entity to add the component to.
     * @param component - The name of the component.
     * @param data - The component data.
     */
    addComponent<K extends keyof T>(e: T, component: K, data: T[K]): void {
        e[component] = data;
        this.updateQueries(e);
    }

    /**
     * Removes a component from an entity and updates queries.
     * @param e - The entity to remove the component from.
     * @param component - The name of the component.
     */
    removeComponent<K extends keyof T>(e: T, component: K): void {
        delete e[component];
        this.updateQueries(e);
    }

    /**
     * Updates the state of an entity and tracks component changes.
     * @param e - The entity to update.
     * @param updateOrFn - An update object or a function that modifies the entity.
     */
    updateState(e: T, updateOrFn: Function | object): void {
        if (typeof updateOrFn === 'function') {
            updateOrFn(e);
        } else {
            Object.assign(e, updateOrFn);
        }
        this.updateQueries(e);
    }

    /**
     * Updates all queries to reflect changes in entity components.
     * @param e - The entity to update in the queries.
     */
    private updateQueries(e: T): void {
        for (const query of this.queries) {
            const hasAllComponents = query.params.every(param => param in e);
            const index = query.entities.indexOf(e);

            if (hasAllComponents && index === -1) {
                query.entities.push(e);
                query.onEntityAdded.forEach(cb => cb(e));
            } else if (!hasAllComponents && index !== -1) {
                query.entities.splice(index, 1);
                query.onEntityRemoved.forEach(cb => cb(e));
            }
        }
    }

    /**
     * Creates a query to track entities with specific components.
     * @param params - The list of component names to query for.
     * @returns The query object.
     */
    has(params: string[]): Query {
        const query: Query = {
            entities: this.entities.filter(e => params.every(param => param in e)),
            onEntityAdded: [],
            onEntityRemoved: [],
            params: params
        };
        this.queries.push(query);
        return query;
    }

    /**
     * Creates a query to track entities without specific components.
     * @param params - The list of component names to query for.
     * @returns The query object.
     */
    none(params: string[]): Query {
        const query: Query = {
            entities: this.entities.filter(e => params.every(param => !(param in e))),
            onEntityAdded: [],
            onEntityRemoved: [],
            params: params
        };
        this.queries.push(query);
        return query;
    }

    /**
     * Creates a query to track entities that meet a specific condition.
     * @param condition - The callback function condition to query for.
     * @returns The query object.
     */
    where(condition: Callback<T>): Query {
        const query: Query = {
            entities: this.entities.filter(e => condition(e)),
            onEntityAdded: [],
            onEntityRemoved: [],
            params: []
        };
        this.queries.push(query);
        return query;
    }

    /**
     * Adds a system to the world.
     * @param system - The system function to add.
     */
    addSystem(system: System): void {
        this.systems.push(system);
    }

    /**
     * Runs all systems with the given delta time.
     * @param deltaTime - The time passed since the last update.
     */
    runSystems(deltaTime: number): void {
        this.systems.forEach(system => system(deltaTime));
    }
}
