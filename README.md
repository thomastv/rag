# RAG Application

## Overview
This sample RAG application is designed to test the OpenAI API to manage data with Pinecone by parsing PDF files.


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
