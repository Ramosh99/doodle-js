# AI Integration Features

## Overview
This application now includes an AI-powered diagram generator that allows users to create use case diagrams by describing them in natural language.

## Features

### AI Use Case Diagram Generator
- Click the "🤖 AI Diagram Generator" button in the top-right corner
- Enter a description of your system or use case in the text area
- The system will analyze your prompt and generate a basic use case diagram
- The diagram will include:
  - Actors (stick figures) based on entities mentioned in the prompt
  - Use cases (ellipses) based on actions/verbs in the prompt
  - System boundary (rectangle) to frame the diagram
  - Connecting lines between actors and use cases

### Supported Entities
The AI system recognizes common actors such as:
- User, Admin, Customer, Manager, Employee, Client
- Guest, Member, Viewer, Editor, System, External System

### Supported Use Cases
The system identifies common verbs that indicate use cases:
- login, register, create, read, update, delete
- view, edit, search, filter, upload, download
- manage, access, submit, approve, reject
- configure, setup, reset, change, select, add
- remove, modify, assign, notify, send

## How to Use

1. Click the "🤖 AI Diagram Generator" button
2. Enter a description in the prompt field, for example:
   - "A banking system where customers can login, transfer money, and view account details"
   - "An e-commerce system with users who can search products, add to cart, and checkout"
3. Click "Generate Diagram"
4. The system will create a basic use case diagram based on your description
5. You can then edit, move, and customize the generated diagram elements

## Technical Implementation

The AI integration is a mock implementation that parses the user's text prompt to identify actors and use cases. In a production environment, this would connect to an actual AI API such as OpenAI's GPT or similar services.

The generated elements are fully compatible with the existing drawing system and can be:
- Moved around the canvas
- Resized
- Recolored
- Saved and loaded
- Combined with manually drawn elements

## Customization

The AI generator can be extended by:
- Adding more recognized actors and use cases
- Improving the parsing algorithm
- Connecting to a real AI API
- Adding support for other diagram types (sequence diagrams, class diagrams, etc.)