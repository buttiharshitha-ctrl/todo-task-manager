TO-DO TASK MANAGER — RUN CHEYYADAM ELA (WINDOWS)

Folder structure:
todo_task_manager/
  frontend/
    index.html
    style.css
    script.js
  backend/
    app.py
    database.py
    requirements.txt
    tasks.db  (first run app.py start chesinappudu automatic ga create avutundi)

STEP 1: ZIP extract cheyyandi
1. Download chesina ZIP meeda right-click cheyyandi.
2. Extract All... select cheyyandi.
3. Extract ayina todo_task_manager folder ni VS Code lo Open Folder cheyyandi.

STEP 2: Python check
VS Code lo Terminal > New Terminal open cheyyandi.
Ee command run cheyyandi:
  python --version
Version kanipinchakapothe Python install cheyyali; installation time lo "Add Python to PATH" tick cheyyandi.

STEP 3: Backend install
VS Code terminal lo:
  cd backend
  python -m pip install -r requirements.txt

STEP 4: Flask start
Ade backend terminal lo:
  python app.py
Terminal open ga unchandi. "Running on http://127.0.0.1:5000" ani ravali.

STEP 5: API test
Laptop lo browser open chesi ee URL enter cheyyandi:
  http://127.0.0.1:5000/api/health
Expected:
  {"database":"SQLite","status":"ok"}
Tarvata:
  http://127.0.0.1:5000/api/tasks
Modatlo empty list [] ravachu. Adi normal.

STEP 6: Frontend open
VS Code lo frontend/index.html file open cheyyandi.
Live Server extension install chesi unte, index.html meeda right-click > Open with Live Server click cheyyandi.
Leda frontend folder lo File Explorer open chesi index.html ni double-click cheyyandi.
Frontend mariyu Flask rendu same laptop lo run avvali.

IMPORTANT:
- Phone lo http://127.0.0.1:5000 open cheyyakandi. Phone lo 127.0.0.1 ante phone-ne, laptop kaadu.
- Laptop lo backend run avutunte laptop browser lo 127.0.0.1:5000 use cheyyandi.
- Flask terminal close chesthe backend stop avutundi.
- SQLite database backend/tasks.db lo automatic ga save avutundi.
- API error vaste browser DevTools (F12) > Console chudandi; terminal error kuda share cheyyandi.

API endpoints:
GET     /api/tasks          all tasks
POST    /api/tasks          create task
GET     /api/tasks/<id>     one task
PUT     /api/tasks/<id>     update task
PATCH   /api/tasks/<id>/status  update status
DELETE  /api/tasks/<id>     delete task
GET     /api/health         health check
