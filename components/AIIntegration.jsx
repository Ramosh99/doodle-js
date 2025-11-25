'use client';
import React, { useState } from 'react';
import rough from 'roughjs/bundled/rough.esm';
import { ElementType, Rectangle, Line } from './Types/types';

const generator = rough.generator();

const AIIntegration = ({ setElements, setActiveElem }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Function to generate a use case diagram based on the prompt
  const generateUseCaseDiagram = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    
    try {
      // This is a mock implementation - in a real application, you would connect to an AI API
      // For now, I'll generate a simple use case diagram based on common patterns
      const diagramElements = generateUseCaseElements(prompt);
      setElements(diagramElements);
      setActiveElem([]);
      setShowModal(false);
      setPrompt('');
    } catch (error) {
      console.error('Error generating diagram:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to generate use case diagram elements from a prompt
  const generateUseCaseElements = (prompt) => {
    // This is a simplified implementation that creates basic use case diagram elements
    // based on common patterns in the prompt
    const elements = [];
    const centerX = 400;
    const centerY = 300;
    
    // Parse the prompt to identify actors and use cases
    const actors = extractActors(prompt);
    const useCases = extractUseCases(prompt);
    
    // Create actors (stick figures)
    actors.forEach((actor, index) => {
      const angle = (index * 2 * Math.PI) / actors.length;
      const x = centerX + 200 * Math.cos(angle);
      const y = centerY + 200 * Math.sin(angle);
      
      // Draw actor as a simple stick figure
      elements.push(...createActor(x, y, actor));
    });
    
    // Create use cases (ellipses)
    useCases.forEach((useCase, index) => {
      const angle = (index * 2 * Math.PI) / useCases.length + Math.PI / useCases.length;
      const x = centerX + 100 * Math.cos(angle);
      const y = centerY + 100 * Math.sin(angle);
      
      elements.push(...createUseCase(x, y, useCase));
    });
    
    // Create system boundary (rectangle)
    elements.push(createSystemBoundary(centerX - 150, centerY - 100, centerX + 150, centerY + 100));
    
    // Create lines connecting actors to use cases
    actors.forEach((_, actorIndex) => {
      useCases.forEach((_, useCaseIndex) => {
        // For simplicity, connect each actor to each use case
        const actorAngle = (actorIndex * 2 * Math.PI) / actors.length;
        const actorX = centerX + 200 * Math.cos(actorAngle);
        const actorY = centerY + 200 * Math.sin(actorAngle);
        
        const useCaseAngle = (useCaseIndex * 2 * Math.PI) / useCases.length + Math.PI / useCases.length;
        const useCaseX = centerX + 100 * Math.cos(useCaseAngle);
        const useCaseY = centerY + 100 * Math.sin(useCaseAngle);
        
        elements.push(createLine(actorX, actorY, useCaseX, useCaseY));
      });
    });
    
    return elements;
  };

  // Extract actors from the prompt
  const extractActors = (prompt) => {
    const commonActors = [
      'User', 'Admin', 'Customer', 'Manager', 'Employee', 'Client', 
      'Guest', 'Member', 'Viewer', 'Editor', 'System', 'External System'
    ];
    
    const foundActors = [];
    commonActors.forEach(actor => {
      if (prompt.toLowerCase().includes(actor.toLowerCase()) && !foundActors.includes(actor)) {
        foundActors.push(actor);
      }
    });
    
    // If no specific actors found, add a default one
    if (foundActors.length === 0) {
      foundActors.push('User');
    }
    
    return foundActors;
  };

  // Extract use cases from the prompt
  const extractUseCases = (prompt) => {
    // Look for common verbs that indicate use cases
    const verbs = [
      'login', 'register', 'create', 'read', 'update', 'delete', 
      'view', 'edit', 'search', 'filter', 'upload', 'download',
      'manage', 'access', 'view', 'submit', 'approve', 'reject',
      'configure', 'setup', 'reset', 'change', 'select', 'add',
      'remove', 'modify', 'assign', 'assign', 'notify', 'send'
    ];
    
    const foundUseCases = [];
    verbs.forEach(verb => {
      if (prompt.toLowerCase().includes(verb) && !foundUseCases.some(uc => uc.toLowerCase().includes(verb))) {
        // Extract the full phrase containing the verb
        const regex = new RegExp(`\\b\\w*\\s*${verb}\\s*\\w*\\b`, 'gi');
        const matches = prompt.match(regex);
        if (matches) {
          matches.forEach(match => {
            const cleaned = match.trim();
            if (!foundUseCases.includes(cleaned)) {
              foundUseCases.push(cleaned);
            }
          });
        }
      }
    });
    
    // If no specific use cases found, add a default one
    if (foundUseCases.length === 0) {
      foundUseCases.push('View System');
    }
    
    return foundUseCases.slice(0, 5); // Limit to 5 use cases for clarity
  };

  // Create an actor (stick figure)
  const createActor = (x, y, label) => {
    const elements = [];
    
    // Head (circle)
    elements.push(createCircle(x, y - 20, x + 10, y - 10));
    
    // Body (line)
    elements.push(createLine(x + 5, y, x + 5, y + 30));
    
    // Arms (lines)
    elements.push(createLine(x - 10, y + 15, x + 20, y + 15));
    
    // Legs (lines)
    elements.push(createLine(x + 5, y + 30, x - 5, y + 50));
    elements.push(createLine(x + 5, y + 30, x + 15, y + 50));
    
    // Label
    elements.push(createText(x - 10, y + 65, label));
    
    return elements;
  };

  // Create a use case (ellipse)
  const createUseCase = (x, y, label) => {
    const elements = [];
    // Create ellipse for use case
    const ellipseElement = {
      type: 'ellipse',
      x1: x - 40,
      y1: y - 15,
      x2: x + 40,
      y2: y + 15,
      roughElement: generator.ellipse(x, y, 80, 30, {
        stroke: 'black',
        strokeWidth: 1,
        fill: 'none'
      })
    };
    elements.push(ellipseElement);
    
    // Add label text
    elements.push(createText(x, y + 5, label));
    
    return elements;
  };

  // Create system boundary
  const createSystemBoundary = (x1, y1, x2, y2) => {
    return createRectangle(x1, y1, x2, y2, 'System Boundary');
  };

  // Helper functions to create different element types
  const createLine = (x1, y1, x2, y2) => {
    return {
      type: 'line',
      x1,
      y1,
      x2,
      y2,
      roughElement: generator.line(x1, y1, x2, y2, {
        stroke: 'black',
        strokeWidth: 1
      })
    };
  };

  const createCircle = (x1, y1, x2, y2) => {
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    const radius = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 2;
    
    return {
      type: 'circle',
      x1,
      y1,
      x2,
      y2,
      roughElement: generator.circle(centerX, centerY, radius * 2, {
        stroke: 'black',
        strokeWidth: 1
      })
    };
  };

  const createRectangle = (x1, y1, x2, y2, label = '') => {
    return {
      type: ElementType.RECTANGLE,
      x1,
      y1,
      x2,
      y2,
      roughElement: generator.rectangle(x1, y1, x2 - x1, y2 - y1, {
        stroke: 'black',
        strokeWidth: 1,
        fill: 'none'
      })
    };
  };

  const createText = (x, y, text) => {
    // For now, we'll create a placeholder element since rough.js doesn't directly support text
    // In a real implementation, you would handle text separately
    return {
      type: 'text',
      x,
      y,
      text,
      roughElement: generator.line(x, y, x + 1, y + 1, { // Placeholder
        stroke: 'transparent',
        strokeWidth: 0
      })
    };
  };

  return (
    <>
      <button 
        className="selectIcon"
        style={{ 
          position: 'absolute', 
          top: '10px', 
          right: '20px', 
          zIndex: 100,
          padding: '8px 16px',
          backgroundColor: '#4F46E5',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
        onClick={() => setShowModal(true)}
      >
        🤖 AI Diagram Generator
      </button>

      {showModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              width: '500px',
              maxHeight: '80vh',
              overflowY: 'auto',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 15px 0', color: '#333' }}>AI Use Case Diagram Generator</h2>
            
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your system or use case. For example: 'A banking system where customers can login, transfer money, and view account details'"
              style={{
                width: '100%',
                height: '120px',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                resize: 'vertical',
                fontSize: '14px'
              }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px', gap: '10px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: '#f5f5f5',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={generateUseCaseDiagram}
                disabled={isLoading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? 'Generating...' : 'Generate Diagram'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIIntegration;