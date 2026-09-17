from fastapi import FastAPI

app = FastAPI(title='SAT-SA API')

@app.get('/')
def read_root():
    return {'message': 'SAT-SA Air-Gapped Engine Running'}
