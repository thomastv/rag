# TypeScript Application

## Overview
This is a TypeScript application designed to demonstrate the integration of various services and utilities. The application includes functionality for interacting with the OpenAI API, managing data with Pinecone, and parsing PDF files.

## Project Structure
```
typescript-app
├── src
│   ├── index.ts
│   ├── config
│   │   └── config.ts
│   ├── services
│   │   ├── openaiService.ts
│   │   ├── pineconeService.ts
│   └── utils
│       └── pdfParser.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd typescript-app
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage
To run the application, use the following command:
```
npm start
```

## Configuration
Configuration settings can be found in the `src/config/config.ts` file. Ensure that any necessary environment variables are set in your environment or in a `.env` file.

## Services
- **OpenAI Service**: Interacts with the OpenAI API for various functionalities.
- **Pinecone Service**: Manages data storage and retrieval using Pinecone.

## Utilities
- **PDF Parser**: Provides functions for extracting text and metadata from PDF documents.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.