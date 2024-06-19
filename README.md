# Sword ECS 🗡️

Sword ECS is a lightweight Entity Component System library for JavaScript with support for archetypes, typed entities, and lifecycle hooks.

## Features ✨

- **Entity Management**: Easily add, remove, and update entities with components.
- **Component-based Design**: Define entities using components for flexible entity composition.
- **System Execution**: Register systems to process entities based on their components.
- **Lifecycle Hooks**: Callbacks for entity addition and removal events.
- **Query System**: Efficiently query entities based on component requirements.

## Usage Example 🚀

```typescript
import { Sword, Component, Entity, System, QueryResult } from 'sword-ecs';

// Initialize Sword ECS
const sword = new Sword();

// Define components
type PositionComponent = { x: number; y: number; };
type VelocityComponent = { dx: number; dy: number; };

// Example entities
const entity1: Entity<PositionComponent> = { x: 0, y: 0 };
const entity2: Entity<PositionComponent & VelocityComponent> = { x: 10, y: 10, dx: 1, dy: -1 };

// Add entities to ECS
sword.addEntity(entity1);
sword.addEntity(entity2);

// Define a system to update entity positions
const movementSystem: System = (dt?: number) => {
  sword.getEntitiesWithComponents('x', 'y', 'dx', 'dy').entities
  
  
  return function (dt: number) {
      forEach(entity => {
        entity.x += entity.dx * (dt || 1);
        entity.y += entity.dy * (dt || 1);
        sword.updateEntity(entity, { x: entity.x, y: entity.y });
      });
  }
};

// Add the system to ECS
sword.addSystem(movementSystem);

// Update ECS
const deltaTime = 0.1;
sword.update(deltaTime);
````

## Installation 📦
You can install Sword ECS via npm:

```bash
npm install sword-ecs
```
## Documentation 📚
For detailed API documentation and usage examples, refer to the Sword ECS Documentation.

## Contributing 🤝
Contributions are welcome! Please check out the contribution guidelines.

## License 📄
This project is licensed under the MIT License - see the LICENSE file for details.