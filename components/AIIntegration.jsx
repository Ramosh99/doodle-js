'use client';
import React, { useState } from 'react';
import rough from 'roughjs/bundled/rough.esm';
import { ElementType, Rectangle, Line } from './Types/types';

const generator = rough.generator();

const AIIntegration = ({ setElements, setActiveElem }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const normalizeName = (value) => String(value || '').trim();
  const normalizeNameKey = (value) => normalizeName(value).toLowerCase();

  const isErPrompt = (value) => {
    const normalized = String(value || '').toLowerCase();
    return (
      normalized.includes(' er ') ||
      normalized.startsWith('er ') ||
      normalized.includes('er diagram') ||
      normalized.includes('entity relationship') ||
      normalized.includes('entity-relationship')
    );
  };

  // Generate diagram based on the prompt and model response
  const generateUseCaseDiagram = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const generationResult = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });

      if (!generationResult.ok) {
        const payload = await generationResult.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to generate diagram right now.');
      }

      const payload = await generationResult.json();
      const wantsErDiagram = isErPrompt(prompt) || payload.diagramType === 'er';
      const diagramElements = wantsErDiagram
        ? generateErElements(
            payload.entities?.length ? payload.entities : fallbackErEntities(prompt),
            payload.relationships?.length ? payload.relationships : fallbackErRelationships(prompt)
          )
        : generateUseCaseElements(
            payload.actors?.length ? payload.actors : extractActors(prompt),
            payload.useCases?.length ? payload.useCases : extractUseCases(prompt)
          );

      setElements(diagramElements);
      setActiveElem([]);
      setShowModal(false);
      setPrompt('');
    } catch (error) {
      console.error('Error generating diagram:', error);
      setErrorMessage(error.message || 'Something went wrong while generating.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to generate use case diagram elements from actor and use-case arrays
  const generateUseCaseElements = (actors, useCases) => {
    const elements = [];
    const centerX = 400;
    const centerY = 300;
    
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

  const fallbackErEntities = (promptText) => {
    const normalized = String(promptText || '').toLowerCase();
    if (normalized.includes('bank') || normalized.includes('payment')) {
      return [
        { name: 'Customer', attributes: ['customer_id (PK)', 'name', 'email', 'phone'] },
        { name: 'Account', attributes: ['account_id (PK)', 'customer_id (FK)', 'account_type', 'balance'] },
        { name: 'Payment', attributes: ['payment_id (PK)', 'account_id (FK)', 'merchant_id (FK)', 'amount', 'status', 'created_at'] },
        { name: 'Merchant', attributes: ['merchant_id (PK)', 'name', 'category'] },
        { name: 'Transaction', attributes: ['transaction_id (PK)', 'payment_id (FK)', 'reference', 'processed_at'] },
      ];
    }

    return [
      { name: 'User', attributes: ['user_id (PK)', 'name', 'email'] },
      { name: 'Project', attributes: ['project_id (PK)', 'owner_id (FK)', 'name'] },
      { name: 'Record', attributes: ['record_id (PK)', 'project_id (FK)', 'created_at'] },
    ];
  };

  const fallbackErRelationships = (promptText) => {
    const normalized = String(promptText || '').toLowerCase();
    if (normalized.includes('bank') || normalized.includes('payment')) {
      return [
        { from: 'Customer', to: 'Account', label: 'owns', cardinality: '1:N' },
        { from: 'Account', to: 'Payment', label: 'initiates', cardinality: '1:N' },
        { from: 'Merchant', to: 'Payment', label: 'receives', cardinality: '1:N' },
        { from: 'Payment', to: 'Transaction', label: 'records', cardinality: '1:1' },
      ];
    }

    return [
      { from: 'User', to: 'Project', label: 'owns', cardinality: '1:N' },
      { from: 'Project', to: 'Record', label: 'contains', cardinality: '1:N' },
    ];
  };

  const generateErElements = (entities, relationships) => {
    const cleanEntities = (entities || [])
      .map((entity) => ({
        name: normalizeName(entity?.name),
        attributes: (entity?.attributes || []).map((attr) => normalizeName(attr)).filter(Boolean).slice(0, 8)
      }))
      .filter((entity) => entity.name)
      .slice(0, 8);

    const cleanRelationships = (relationships || [])
      .map((relation) => ({
        from: normalizeName(relation?.from),
        to: normalizeName(relation?.to),
        label: normalizeName(relation?.label),
        cardinality: normalizeName(relation?.cardinality)
      }))
      .filter((relation) => relation.from && relation.to)
      .slice(0, 12);

    if (!cleanEntities.length) {
      return generateUseCaseElements(['User'], ['View System']);
    }

    const elements = [];
    const startX = 120;
    const startY = 120;
    const colWidth = 300;
    const rowHeight = 220;
    const columns = Math.max(2, Math.ceil(Math.sqrt(cleanEntities.length)));
    const entityCenters = {};

    cleanEntities.forEach((entity, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x1 = startX + (col * colWidth);
      const y1 = startY + (row * rowHeight);
      const x2 = x1 + 220;
      const dynamicHeight = Math.max(80, 40 + (entity.attributes.length * 18));
      const y2 = y1 + dynamicHeight;

      elements.push(createRectangle(x1, y1, x2, y2));
      elements.push(createLine(x1, y1 + 28, x2, y1 + 28));
      elements.push(createText(x1 + 10, y1 + 6, entity.name, 190, 22));

      entity.attributes.forEach((attribute, attrIndex) => {
        elements.push(createText(x1 + 10, y1 + 34 + (attrIndex * 16), attribute, 190, 16));
      });

      entityCenters[normalizeNameKey(entity.name)] = {
        x: (x1 + x2) / 2,
        y: (y1 + y2) / 2,
      };
    });

    cleanRelationships.forEach((relation) => {
      const from = entityCenters[normalizeNameKey(relation.from)];
      const to = entityCenters[normalizeNameKey(relation.to)];

      if (!from || !to) return;

      elements.push(createLine(from.x, from.y, to.x, to.y));
      const label = [relation.label, relation.cardinality].filter(Boolean).join(' ');
      if (label) {
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        elements.push(createText(midX + 4, midY + 4, label, 180, 18));
      }
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

  const createText = (x, y, text, width = 200, height = 24) => {
    return {
      type: 'text',
      x1: x,
      y1: y,
      x2: x + width,
      y2: y + height,
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
        id="btn-ai-generator"
        className="selectIcon"
        style={{ 
          position: 'fixed', 
          top: '10px', 
          right: '340px', 
          zIndex: 100,
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          color: 'white',
          border: 'none',
          borderRadius: '24px',
          padding: '8px 18px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(168, 85, 247, 0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s ease-in-out',
          fontSize: '14px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px) scale(1.03)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(168, 85, 247, 0.45)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(168, 85, 247, 0.35)';
        }}
        onClick={() => setShowModal(true)}
      >
        <span>🤖</span> AI Diagram Generator
      </button>

      {showModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(15, 23, 42, 0.3)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: '24px',
              borderRadius: '16px',
              width: '520px',
              maxHeight: '85vh',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.7)',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ 
              margin: '0 0 10px 0', 
              color: '#1e293b', 
              fontSize: '20px', 
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🪄</span> AI Diagram Creator
            </h2>
            <p style={{ 
              margin: '0 0 20px 0', 
              color: '#64748b', 
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              Describe the diagram you want (e.g. Use Case or Entity Relationship). Our AI will instantly model and render it on your canvas.
            </p>

            {errorMessage ? (
              <div
                style={{
                  marginBottom: '16px',
                  color: '#e11d48',
                  backgroundColor: '#fff1f2',
                  border: '1px solid #fecdd3',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  lineHeight: '1.4'
                }}
              >
                {errorMessage}
              </div>
            ) : null}
            
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Generate a use case diagram for a food delivery service with Customer, Driver, and Restaurant actors..."
              style={{
                width: '100%',
                height: '140px',
                padding: '12px',
                border: '1.5px solid #cbd5e1',
                borderRadius: '10px',
                resize: 'none',
                fontSize: '14px',
                lineHeight: '1.5',
                outline: 'none',
                color: '#334155',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
            />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '12px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '24px',
                  backgroundColor: 'white',
                  color: '#475569',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                Cancel
              </button>
              <button
                onClick={generateUseCaseDiagram}
                disabled={isLoading || !prompt.trim()}
                style={{
                  padding: '10px 20px',
                  background: isLoading || !prompt.trim() 
                    ? '#94a3b8' 
                    : 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '24px',
                  cursor: isLoading || !prompt.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  boxShadow: isLoading || !prompt.trim() ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.25)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && prompt.trim()) {
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {isLoading ? 'Creating...' : 'Create Diagram'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIIntegration;