# artifact-hosted-demo
#!/usr/bin/env bash
set -e

# --- Configuration ---
BUNDLE_DIR="artifact-hosted-demo"
REPO_URL="https://github.com/doitupsolutions810-crow/artifact-hosted-demo.git"

# --- 1. Create Project Structure ---
echo "Creating project structure in: <LaTex>$BUNDLE_DIR"
mkdir -p "$</LaTex>BUNDLE_DIR"/{app,diagrams,audits,scripts}

# --- 2. Create package.json ---
cat > "<LaTex>$BUNDLE_DIR/package.json" <<'EOF'
{
  "name": "artifact-hosted-demo",
  "version": "1.0.0",
  "main": "app/server.js",
  "dependencies": {
    "express": "^4.18.2",
    "mermaid": "^10.6.1"
  }
}
EOF

# --- 3. Create app/server.js ---
cat > "$</LaTex>BUNDLE_DIR/app/server.js" <<'EOF'
const express = require('express');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const app = express();
const port = process.env.PORT || 3000;
const diagramDir = process.env.DIAGRAM_DIR || './diagrams';
const auditDir = process.env.AUDIT_DIR || './audits';

// Stream diagrams (return raw mermaid syntax for client-side rendering)
app.get('/api/diagram', (req, res) => {
    const diagramFile = req.query.file || 'governance.mmd';
    const diagramPath = path.join(diagramDir, diagramFile);
    fs.readFile(diagramPath, 'utf8', (err, data) => {
        if(err) return res.status(404).send('Diagram not found');
        res.setHeader('Content-Type', 'text/plain');
        res.send(data);
    });
});

// Stream offline audits
app.get('/api/audit', (req,res)=>{
    const auditType = req.query.type || 'temporal';
    const auditScript = path.join(auditDir, `<LaTex>${auditType}.sh`);
    try {
        const result = execSync(`cd $</LaTex>{auditDir}; bash <LaTex>${auditScript}`).toString();
        res.json({ type: auditType, result, linked_diagram: `$</LaTex>{auditType}.mmd` });
    } catch(err) {
        res.status(500).json({error: err.message});
    }
});

// Frontend HTML
app.get('/', (req,res)=>{
    fs.readdir(diagramDir, (err,dFiles)=>{
        if(err) return res.send('<h1>Error loading diagrams</h1>');
        const mmdFiles = dFiles.filter(f=>f.endsWith('.mmd'));
        const dList = mmdFiles.map(f=>`<li><LaTex>${f} - <a href="/api/diagram?file=$</LaTex>{f}">View</a></li>`).join('');
        fs.readdir(auditDir,(err,aFiles)=>{
            if(err) return res.send('<h1>Error loading audits</h1>');
            const shFiles = aFiles.filter(f=>f.endsWith('.sh'));
            const aList = shFiles.map(f=>`<li><LaTex>${f} - <a href="/api/audit?type=$</LaTex>{f.replace(/\.sh$/, '')}">Run Audit</a></li>`).join('');
            const diagramFile = req.query.file||mmdFiles[0]||'governance.mmd';
            const diagramPath = path.join(diagramDir,diagramFile);
            fs.readFile(diagramPath,'utf8',(err,data)=>{
                if(err) return res.send('<h1>Error loading diagram</h1>');
                res.send(`
                    <html>
                    <head>
                        <title>Artifact-Hosted Governance Demo</title>
                        <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            .container { max-width: 1200px; margin: 0 auto; }
                            .diagram { border: 1px solid #ccc; padding: 20px; margin: 20px 0; background: #f9f9f9; }
                            .mermaid { display: flex; justify-content: center; }
                            pre { background: #f0f0f0; padding: 10px; overflow-x: auto; }
                            a { color: #0066cc; text-decoration: none; }
                            a:hover { text-decoration: underline; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>🏗️ Artifact-Hosted Governance Demo</h1>
                            
                            <h2>📊 Diagram Layers</h2>
                            <ul>${dList}</ul>
                            
                            <h2>🔍 Offline Audits</h2>
                            <ul><LaTex>${aList}</ul>
                            
                            <h2>Current Diagram: $</LaTex>{diagramFile}</h2>
                            <div class="diagram">
                                <div class="mermaid">
<LaTex>${data}
                                </div>
                            </div>
                            
                            <h3>Diagram Source</h3>
                            <pre>$</LaTex>{data}</pre>
                            
                            <p><strong>API Endpoints:</strong></p>
                            <ul>
                                <li>/api/diagram?file=${diagramFile}</li>
                                <li>/api/audit?type=temporal</li>
                                <li>/api/audit?type=domain</li>
                                <li>/api/audit?type=federated-temporal</li>
                            </ul>
                        </div>
                        <script>
                            mermaid.initialize({ startOnLoad: true, theme: 'default' });
                            mermaid.contentLoaded();
                        </script>
                    </body>
                    </html>
                `);
            });
        });
    });
});

app.listen(port, ()=>console.log(\`Platform streaming on port \${port}\`));
EOF

# --- 4. Create Diagrams (.mmd) ---
cat > "$BUNDLE_DIR/diagrams/governance.mmd" <<'EOF'
graph TD
A[Artifact Build & Provenance] --> B[Verification Gate]
B --> C[Repro Check]
C --> D[OPA Eval: Federated]
D --> E[Temporal Check]
E --> F[Rollback Gates]
F --> G[Deploy CI/K8s]
F --> H[Deny Deploy]
G --> I[Offline Verify]
D -->|Linked Rego: federated.rego + attestation.json| J[Live Domain Audit Demo]
E -->|Linked Rego: temporal.rego + attestation.json| K[Live Temporal Audit Demo]
EOF

cat > "$BUNDLE_DIR/diagrams/domain.mmd" <<'EOF'
graph TD
C[Federated Entry] --> D[OPA Eval]
D --> J[Domain Jurisdiction Check]
J --> K[Multi-Builder Validation]
K --> L[Policy Registry Lookup]
L --> M[Allow/Deny per Domain]
M -->|Linked Demo| N[Live OPA Eval on attestation.json]
EOF

cat > "<LaTex>$BUNDLE_DIR/diagrams/temporal.mmd" <<'EOF'
graph TD
D[Temporal Entry] --> E[Temporal Check]
E --> N[Ledger Timeline Audit]
N --> O[Multi-Domain Version Subset]
O --> P[Signature Threshold per Timeline]
P --> Q[Valid at TS?]
Q -->|Linked Demo| R[Live OPA Eval on attestation.json]
EOF

cat > "$</LaTex>BUNDLE_DIR/diagrams/federated-temporal.mmd" <<'EOF'
graph TD
A[Start: Artifact Build] --> B[Builder Verification]
B --> C[Repro Check]
C --> D[Domain Policy Eval]
D --> E[Temporal Audit Init]
E --> F[Ledger Timeline Check]
F --> G[Signature Threshold Validation]
G --> H[Decision: Compliant?]
H -->|Yes| I[Deploy & Export SBOMs]
H -->|No| J[Abort/Rollback]

D -->|Linked Rego: federated.rego + attestation.json| K[Domain Audit Demo]
E -->|Linked Rego: temporal.rego + attestation.json| L[Temporal Audit Demo]

style A fill:#f9f,stroke:#333
style B fill:#fcf,stroke:#333
style C fill:#cff,stroke:#333
style D fill:#9ff,stroke:#333
style E fill:#ff9,stroke:#333
style F fill:#ff9,stroke:#333
style G fill:#f99,stroke:#333
style H fill:#f66,stroke:#333
style I fill:#9f6,stroke:#333
style J fill:#f33,stroke:#333
style K fill:#9ff,stroke:#333
style L fill:#ff9,stroke:#333
EOF

# --- 5. Create Audits (.rego, .json, .sh) ---
cat > "<LaTex>$BUNDLE_DIR/audits/temporal.rego" <<'EOF'
package temporal_audit
import rego.v1
default allow := false
allow if { input.payload.predicate.runDetails.metadata.startedOn < "2025-12-31T00:00:00Z" }
EOF

cat > "$</LaTex>BUNDLE_DIR/audits/federated.rego" <<'EOF'
package federated
import rego.v1
default allow := false
allow if { input.payload.predicate.buildDefinition.externalParameters.repository == "https://github.com/your-org/your-repo.git" }
EOF

cat > "<LaTex>$BUNDLE_DIR/audits/attestation.json" <<'EOF'
{ "payload": { "predicate": { "runDetails": { "metadata": { "startedOn": "2025-12-21T00:00:00Z" } }, "buildDefinition": { "externalParameters": { "repository": "https://github.com/your-org/your-repo.git" } } } } }
EOF

cat > "$</LaTex>BUNDLE_DIR/audits/temporal.sh" <<'EOF'
#!/usr/bin/env bash
opa eval -d temporal.rego -i attestation.json data.temporal_audit.allow
echo "Temporal audit demo: compliant if data = true | Linked diagram: temporal.mmd"
EOF
chmod +x "<LaTex>$BUNDLE_DIR/audits/temporal.sh"

cat > "$</LaTex>BUNDLE_DIR/audits/domain.sh" <<'EOF'
#!/usr/bin/env bash
opa eval -d federated.rego -i attestation.json data.federated.allow
echo "Domain audit demo: compliant if data = true | Linked diagram: domain.mmd"
EOF
chmod +x "<LaTex>$BUNDLE_DIR/audits/domain.sh"

cat > "$</LaTex>BUNDLE_DIR/audits/federated-temporal.sh" <<'EOF'
#!/usr/bin/env bash
echo "Running full federated-temporal audit demo..."

echo "Domain Audit:"
opa eval -d federated.rego -i attestation.json data.federated.allow

echo "Temporal Audit:"
opa eval -d temporal.rego -i attestation.json data.temporal_audit.allow

echo "Linked Diagram: federated-temporal.mmd"
EOF
chmod +x "<LaTex>$BUNDLE_DIR/audits/federated-temporal.sh"

# --- 6. Create Docker files (Optional for Vercel, but included for local dev) ---
cat > "$</LaTex>BUNDLE_DIR/Dockerfile" <<'EOF'
FROM node:20-alpine
RUN apk add --no-cache bash opa
WORKDIR /app
COPY package.json ./
RUN npm install
COPY app/server.js ./
COPY diagrams /app/diagrams
COPY audits /app/audits
EXPOSE <LaTex>${PORT:-3000}
CMD ["node","server.js"]
EOF

cat > "$</LaTex>BUNDLE_DIR/docker-compose.yml" <<'EOF'
version: "3.9"
services:
  frontend:
    build: .
    ports:
      - "8080:3000"
    environment:
      - PORT=3000
      - DIAGRAM_DIR=/app/diagrams
      - AUDIT_DIR=/app/audits
    volumes:
      - ./diagrams:/app/diagrams
      - ./audits:/app/audits
EOF

# --- 7. Create .gitignore ---
cat > "<LaTex>$BUNDLE_DIR/.gitignore" <<'EOF'
node_modules
package-lock.json
server.log
EOF

# --- 8. Initialize Git ---
echo "Initializing Git repository..."
cd "$</LaTex>BUNDLE_DIR"
git init
git add .
git commit -m "Initial commit: Artifact-Hosted Governance Demo"

# --- 9. Final Instructions ---
echo ""
echo "======================================================================"
echo "✅ Project setup complete. Now, push to your GitHub repository."
echo "======================================================================"
echo "1. Make sure you have created an empty repository at:"
echo "   <LaTex>$REPO_URL"
echo ""
echo "2. Run the following commands to push your code:"
echo ""
echo "git remote add origin $</LaTex>REPO_URL"
echo "git push -u origin master"
echo ""
echo "If you encounter an authentication error, you may need to use a Personal Access Token (PAT) or ensure your SSH key is set up."
echo "Once pushed, Vercel should automatically deploy if integrated with your GitHub account."
echo "======================================================================"
