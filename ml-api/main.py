
# ================================================================
# FOUNDRYAI — ML API SERVER
# Serves architecture predictions to Spring Boot backend
# Run: uvicorn main:app --reload --port 8000
# ================================================================

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import json
import os

app = FastAPI(
    title="FoundryAI ML API",
    description="Architecture recommendation engine for fintech apps",
    version="1.0.0"
)

# Allow Spring Boot and React to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load ML models at startup ──────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(
    BASE_DIR, "..", "ml-brain",
    "foundryai_module_classifier_files"
)

print("Loading FoundryAI ML models...")

try:
    model = joblib.load(os.path.join(MODEL_DIR, "architecture_model.pkl"))
    vectorizer = joblib.load(os.path.join(MODEL_DIR, "architecture_vectorizer.pkl"))
    with open(os.path.join(MODEL_DIR, "architecture_data.json"), "r") as f:
        architecture_data = json.load(f)
    print(f"✅ Models loaded. {len(architecture_data)} architectures ready.")
except Exception as e:
    print(f"❌ Error loading models: {e}")
    model = None
    vectorizer = None
    architecture_data = {}

# ── Request and Response models ────────────────────────────────
class QueryRequest(BaseModel):
    query: str

class ModuleRequest(BaseModel):
    module_ids: list[int]

# ── Routes ─────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "status": "FoundryAI ML API is running",
        "architectures_loaded": len(architecture_data),
        "endpoints": [
            "POST /predict          → predict from text query",
            "POST /predict/multiple → predict top 3 matches",
            "POST /combine          → combine multiple modules",
            "GET  /architecture/{id} → get full architecture data",
            "GET  /all              → get all 32 architectures",
            "GET  /health           → health check"
        ]
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "architectures": len(architecture_data)
    }

@app.post("/predict")
def predict(request: QueryRequest):
    """
    Main endpoint — takes user text, returns best matching architecture
    Called by Spring Boot when user types or selects architecture
    """
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        # Vectorize input
        vec = vectorizer.transform([request.query.lower()])

        # Predict
        pred_id = int(model.predict(vec)[0])
        probabilities = model.predict_proba(vec)[0]
        confidence = float(probabilities.max() * 100)

        # Get full architecture data
        arch = architecture_data.get(str(pred_id), {})

        return {
            "success": True,
            "query": request.query,
            "predicted_id": pred_id,
            "confidence": round(confidence, 1),
            "architecture": {
                "id": pred_id,
                "name": arch.get("name", ""),
                "level": arch.get("level", ""),
                "pattern": arch.get("pattern", ""),
                "app_type": arch.get("app_type", ""),
                "modules": arch.get("modules", []),
                "frontend": arch.get("frontend", ""),
                "backend": arch.get("backend", ""),
                "database": arch.get("database", ""),
                "ml_needed": arch.get("ml_needed", ""),
                "protocols": arch.get("protocols", ""),
                "why_frontend": arch.get("why_frontend", ""),
                "why_backend": arch.get("why_backend", ""),
                "why_database": arch.get("why_database", ""),
                "why_pattern": arch.get("why_pattern", ""),
                "security": arch.get("security", ""),
                "rbi_rules": arch.get("rbi_rules", ""),
                "skills": arch.get("skills", ""),
                "how_it_works": arch.get("how_it_works", ""),
                "flow_steps": arch.get("flow_steps", []),
                "real_world": arch.get("real_world_ref", ""),
                "complexity": arch.get("complexity", ""),
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/multiple")
def predict_multiple(request: QueryRequest):
    """
    Returns top 3 matching architectures with confidence scores
    Used when user query is ambiguous
    """
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    try:
        vec = vectorizer.transform([request.query.lower()])
        probabilities = model.predict_proba(vec)[0]
        classes = model.classes_

        # Get top 3
        top3_indices = probabilities.argsort()[-3:][::-1]
        results = []

        for idx in top3_indices:
            arch_id = int(classes[idx])
            confidence = float(probabilities[idx] * 100)
            arch = architecture_data.get(str(arch_id), {})
            results.append({
                "id": arch_id,
                "name": arch.get("name", ""),
                "level": arch.get("level", ""),
                "pattern": arch.get("pattern", ""),
                "confidence": round(confidence, 1),
                "complexity": arch.get("complexity", ""),
            })

        return {
            "success": True,
            "query": request.query,
            "top_matches": results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/combine")
def combine_modules(request: ModuleRequest):
    """
    Combines multiple selected module architectures into one
    Called when user selects multiple items from dropdown list
    Example: user selects IDs [1, 5, 8] = Login + SendMoney + Fraud
    """
    if not request.module_ids:
        raise HTTPException(status_code=400, detail="No module IDs provided")

    combined_modules = []
    combined_protocols = set()
    combined_skills = set()
    combined_flow = []
    names = []
    all_why = {}

    for arch_id in request.module_ids:
        arch = architecture_data.get(str(arch_id))
        if not arch:
            continue

        names.append(arch.get("name", ""))

        # Combine modules list
        mods = arch.get("modules", [])
        if isinstance(mods, list):
            for m in mods:
                if m not in combined_modules:
                    combined_modules.append(m)

        # Combine protocols
        protocols = arch.get("protocols", "")
        if protocols:
            for p in protocols.split(","):
                combined_protocols.add(p.strip())

        # Combine skills
        skills = arch.get("skills", "")
        if skills:
            for s in skills.split(","):
                combined_skills.add(s.strip())

        # Combine flow steps
        steps = arch.get("flow_steps", [])
        if isinstance(steps, list):
            combined_flow.extend(steps)
        elif isinstance(steps, str):
            combined_flow.append(steps)

        # Collect why explanations
        all_why[arch.get("name", f"Module {arch_id}")] = {
            "why_frontend": arch.get("why_frontend", ""),
            "why_backend": arch.get("why_backend", ""),
            "why_database": arch.get("why_database", ""),
            "why_pattern": arch.get("why_pattern", ""),
            "rbi_rules": arch.get("rbi_rules", ""),
        }

    # Determine combined complexity
    complexities = []
    for arch_id in request.module_ids:
        arch = architecture_data.get(str(arch_id), {})
        c = arch.get("complexity", "low")
        order = {"low": 1, "medium": 2, "high": 3, "very_high": 4}
        complexities.append(order.get(c, 1))
    max_complexity = max(complexities) if complexities else 1
    complexity_map = {1: "low", 2: "medium", 3: "high", 4: "very_high"}

    return {
        "success": True,
        "combined_name": " + ".join(names),
        "selected_ids": request.module_ids,
        "combined_architecture": {
            "modules": combined_modules,
            "protocols": sorted(list(combined_protocols)),
            "skills": sorted(list(combined_skills)),
            "flow_steps": combined_flow,
            "complexity": complexity_map.get(max_complexity, "high"),
            "module_explanations": all_why,
        }
    }


@app.get("/architecture/{arch_id}")
def get_architecture(arch_id: int):
    """
    Returns full architecture data for a specific ID
    Called when user selects from dropdown list directly
    """
    arch = architecture_data.get(str(arch_id))
    if not arch:
        raise HTTPException(
            status_code=404,
            detail=f"Architecture ID {arch_id} not found"
        )
    return {
        "success": True,
        "architecture": arch
    }


@app.get("/all")
def get_all():
    """
    Returns all 32 architectures grouped by level
    Used to populate the select dropdown in React frontend
    """
    modules = []
    full_apps = []
    combined = []

    for arch_id, arch in architecture_data.items():
        item = {
            "id": int(arch_id),
            "name": arch.get("name", ""),
            "level": arch.get("level", ""),
            "pattern": arch.get("pattern", ""),
            "app_type": arch.get("app_type", ""),
            "complexity": arch.get("complexity", ""),
        }
        level = arch.get("level", "")
        if level == "module":
            modules.append(item)
        elif level == "full_app":
            full_apps.append(item)
        elif level == "combined":
            combined.append(item)

    return {
        "success": True,
        "total": len(architecture_data),
        "individual_modules": sorted(modules, key=lambda x: x["id"]),
        "full_applications": sorted(full_apps, key=lambda x: x["id"]),
        "combined_apps": sorted(combined, key=lambda x: x["id"]),
    }


# ── Run server ─────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)