// Component type definition
type Component = {
    [key: string]: any;
};

// Entity type definition with optional ID and generic components
type Entity<T extends Component = {}> = T & { id?: string };

// System type definition
type System = (dt?: number) => void;

// Archetype type definition for grouping entities
type Archetype = Set<string>;
  
// Query result type definition for storing entities and lifecycle hooks
type QueryResult = {
    entities: Entity[];
    onEntityAdded: ((entity: Entity) => void)[];
    onEntityRemoved: ((entity: Entity) => void)[];
};
  
class Sword {
    private entities: Map<string, Entity> = new Map();
    private archetypes: Map<Archetype, QueryResult> = new Map();
    private systems: System[] = [];
    private entityIdCounter = 0;
    private archetypeDefinitions: Map<string, Component> = new Map();
    
    // Lifecycle hooks for entities being added or removed
    public onEntityAdded: ((entity: Entity) => void)[] = [];
    public onEntityRemoved: ((entity: Entity) => void)[] = [];
  
    /**
     * Add a new entity to the ECS.
     * @param entity The entity object to add.
     * @returns The added entity with an assigned ID.
     */
    addEntity<T extends Component>(entity: Entity<T>): Entity<T> {
      const id = (this.entityIdCounter++).toString();
      entity.id = id;
      this.entities.set(id, entity);
      this.updateArchetypes(entity);
      this.onEntityAdded.forEach(callback => callback(entity));
      return entity;
    }
  
    /**
     * Remove an entity from the ECS by its ID.
     * @param id The ID of the entity to remove.
     */
    removeEntity(id: string): void {
      const entity = this.entities.get(id);
      if (entity) {
        this.entities.delete(id);
        this.updateArchetypes(entity, true);
        this.onEntityRemoved.forEach(callback => callback(entity));
      }
    }
  
    /**
     * Add a component to an entity.
     * @param entity The entity to add the component to.
     * @param component The component object to add.
     */
    addComponent<T extends Component>(entity: Entity<T>, component: Component): void {
      Object.assign(entity, component);
      this.updateArchetypes(entity);
    }
  
    /**
     * Remove a component from an entity.
     * @param entity The entity to remove the component from.
     * @param componentKey The key of the component to remove.
     */
    removeComponent<T extends Component>(entity: Entity<T>, componentKey: keyof Component): void {
      delete entity[componentKey];
      this.updateArchetypes(entity);
    }
  
    /**
     * Update an entity with multiple parameters at once.
     * @param entity The entity to update.
     * @param updates An object containing the updates to apply to the entity.
     */
    updateEntity<T extends Component>(entity: Entity<T>, updates: Partial<T>): void {
      Object.assign(entity, updates);
      this.updateArchetypes(entity);
    }
  
    /**
     * Add a system to the ECS.
     * @param system The system function to add.
     */
    addSystem(system: System): void {
      this.systems.push(system);
    }
  
    /**
     * Update all systems in the ECS.
     * @param dt Delta time since the last update.
     */
    update(dt?: number): void {
      for (const system of this.systems) {
        system(dt);
      }
    }
  
    /**
     * Get all entities with specified components.
     * @param componentKeys An array of component keys to filter entities by.
     * @returns A QueryResult object containing entities and lifecycle hooks.
     */
    getEntitiesWithComponents(...componentKeys: (keyof Component)[]): QueryResult {
      const archetype = new Set(componentKeys);
      // @ts-ignore
      if (!this.archetypes.has(archetype)) {
        // @ts-ignore
        this.archetypes.set(archetype, {
          entities: [],
          onEntityAdded: [],
          onEntityRemoved: [],
        });
      }
      // @ts-ignore
      return this.archetypes.get(archetype)!;
    }
  
    /**
     * Generate an archetype with predefined components.
     * @param name The name of the archetype.
     * @param components The default components for the archetype.
     */
    generateArchetype(name: string, components: Component): void {
      this.archetypeDefinitions.set(name, components);
    }
  
    /**
     * Create an entity based on a predefined archetype.
     * @param name The name of the archetype.
     * @returns The created entity.
     */
    createEntityFromArchetype(name: string): Entity | null {
      const components = this.archetypeDefinitions.get(name);
      if (components) {
        return this.addEntity({ ...components });
      }
      return null;
    }
  
    /**
     * Update the archetypes map when an entity's components change.
     * @param entity The entity whose archetypes are to be updated.
     * @param isRemoval Indicates if the entity is being removed.
     */
    private updateArchetypes(entity: Entity, isRemoval = false): void {
      const entityArchetype = new Set(Object.keys(entity));
      this.archetypes.forEach((queryResult, archetype) => {
        const matches = this.isArchetypeMatch(archetype, entityArchetype);
        if (matches) {
          if (isRemoval) {
            const index = queryResult.entities.indexOf(entity);
            if (index !== -1) {
              queryResult.entities.splice(index, 1);
              queryResult.onEntityRemoved.forEach(callback => callback(entity));
            }
          } else {
            if (!queryResult.entities.includes(entity)) {
              queryResult.entities.push(entity);
              queryResult.onEntityAdded.forEach(callback => callback(entity));
            }
          }
        } else if (queryResult.entities.includes(entity)) {
          const index = queryResult.entities.indexOf(entity);
          if (index !== -1) {
            queryResult.entities.splice(index, 1);
            queryResult.onEntityRemoved.forEach(callback => callback(entity));
          }
        }
      });
    }
  
    /**
     * Check if an entity's components match a given archetype.
     * @param archetype The archetype to check against.
     * @param entityArchetype The entity's component keys as an archetype.
     * @returns True if the entity matches the archetype, false otherwise.
     */
    private isArchetypeMatch(archetype: Archetype, entityArchetype: Archetype): boolean {
      return [...archetype].every(key => entityArchetype.has(key));
    }
}
  