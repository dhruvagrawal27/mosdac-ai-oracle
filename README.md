# NavDrishti: AI-based Help Bot for MOSDAC Knowledge Portal

## Overview
NavDrishti is an intelligent virtual assistant designed to provide instant, contextual information retrieval from the MOSDAC (Meteorological and Oceanographic Satellite Data Archival Centre) portal. The bot leverages advanced NLP/ML techniques and a dynamic knowledge graph to resolve user queries about ISRO satellite data, products, and services, overcoming the challenges of layered navigation and mixed content formats.

---

## Problem Statement
The MOSDAC portal (https://www.mosdac.gov.in) hosts a vast array of satellite data, documentation, FAQs, and support material. Users often struggle to locate precise information due to complex navigation and diverse content formats. NavDrishti aims to bridge this gap by providing an AI-powered conversational interface for efficient, accurate, and context-aware information discovery.

---

## Objectives
- Develop an intelligent virtual assistant leveraging NLP/ML for query understanding and precise information retrieval.
- Extract and model structured/unstructured content into a dynamic knowledge graph.
- Support geospatial data intelligence for spatially-aware question answering.
- Ensure contextual, relationship-based information discovery.
- Design a modular solution for deployment across similar web portals.

---

## Features
- **Conversational AI Bot:** Natural language interface for user queries.
- **Knowledge Graph:** Entity and relationship mapping across portal content.
- **Contextual Search:** Retrieval-augmented generation (RAG) for precise answers.
- **Geospatial Intelligence:** Spatially-aware responses for location-based queries.
- **Multi-format Ingestion:** Supports HTML, PDF, DOCX, XLSX, and more.
- **Modular & Scalable:** Easily deployable on other domains with similar architectures.

---

## Tech Stack
- **Frontend:** React, Tailwind CSS, shadcn-ui
- **Backend:** Node.js, Supabase Edge Functions
- **AI/NLP:** Groq LLM (Llama-3), spaCy, NLTK, NVIDIA RAG (suggested)
- **Knowledge Graph:** Custom entity/relation extraction and modeling
- **Other Tools:** Dialogflow, Rasa, LangChain (suggested for future expansion)

---

## Architecture Summary
1. **Data Ingestion:** Crawl and extract structured/unstructured content from MOSDAC (web pages, FAQs, docs, meta tags, etc.).
2. **Knowledge Graph Creation:** Use NLP to extract entities and relationships, building a dynamic knowledge graph.
3. **Model Selection & Training:** Integrate/fine-tune LLM for semantic understanding and conversational context.
4. **Conversational UI:** User-friendly chatbot interface for real-time Q&A.
5. **Integration:** Backend services connect UI, knowledge graph, and LLM for seamless responses.
6. **Modularization:** Designed for scalable deployment on alternate domains.

---

## Setup & Deployment
1. **Clone the Repository:**
   ```sh
   git clone https://github.com/dhruvagrawal27/mosdac-ai-oracle
   cd mosdac-ai-oracle
   ```
2. **Install Dependencies:**
   ```sh
   npm install
   ```
3. **Start the Development Server:**
   ```sh
   npm run dev
   ```
4. **Configure Supabase & Groq API Keys:**
   - Set up your Supabase project and Edge Functions.
   - Add your Groq API key as an environment variable for the Edge Function.
5. **Access the App:**
   - Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## Dataset Requirements
- Static and dynamic web content from MOSDAC, including:
  - Product catalogues, FAQ sections, documentation (PDF, DOCX, XLSX, etc.)
  - Meta tags, tables, web pages, accessibility tags (ARIA-labels)
  - Satellite mission details, product types, scientific articles

---

## Evaluation Parameters
- **Intent Recognition Accuracy:** How accurately user queries are interpreted.
- **Entity Recognition Accuracy:** Precision of keyword/topic extraction.
- **Response Completeness:** Coverage of answer relative to query context.
- **Response Consistency:** Logical consistency across multi-turn conversations.

---

## License
This project is intended for research and educational purposes. For commercial or production use, please contact the maintainers.

---

## Acknowledgements
- ISRO MOSDAC Team
- Open-source contributors
- Groq, Supabase, and the open AI/NLP community
