const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const Etudiant = require('../models/Etudiant');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

afterEach(async () => {
  await Etudiant.deleteMany({});
});

const validStudent = {
  nom: 'Dupont',
  prenom: 'Alice',
  email: 'dupont.alice@ecole.tn',
  filiere: 'Informatique', // valeur valide enum
  annee: 2,
  moyenne: 15
};



// ===============================
// GET ALL
// ===============================
describe('GET /api/etudiants', () => {

  test('retourne un tableau vide si aucun étudiant', async () => {
    const res = await request(app).get('/api/etudiants');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  test('retourne tous les étudiants', async () => {

    await Etudiant.create([
      validStudent,
      { ...validStudent, email: 'bob@ecole.tn' }
    ]);

    const res = await request(app).get('/api/etudiants');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

});


// ===============================
// POST
// ===============================
describe('POST /api/etudiants', () => {

  test('crée un étudiant et retourne 201', async () => {
    const res = await request(app)
      .post('/api/etudiants')
      .send(validStudent);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nom).toBe('Dupont');
    expect(res.body.data._id).toBeDefined();
  });

  test('retourne 400 si le nom est manquant', async () => {
    const { nom, ...invalid } = validStudent;

    const res = await request(app)
      .post('/api/etudiants')
      .send(invalid);

    expect(res.statusCode).toBe(400);
  });

  test('retourne 400 si moyenne < 0', async () => {
    const res = await request(app)
      .post('/api/etudiants')
      .send({ ...validStudent, moyenne: -5 });

    expect(res.statusCode).toBe(400);
  });

  test('retourne 400 si moyenne > 20', async () => {
    const res = await request(app)
      .post('/api/etudiants')
      .send({ ...validStudent, moyenne: 25 });

    expect(res.statusCode).toBe(400);
  });

  test('retourne 400 si moyenne n\'est pas un nombre', async () => {
    const res = await request(app)
      .post('/api/etudiants')
      .send({ ...validStudent, moyenne: 'bonne' });

    expect(res.statusCode).toBe(400);
  });

});


// ===============================
// GET BY ID
// ===============================
describe('GET /api/etudiants/:id', () => {

  test('retourne l\'étudiant correspondant', async () => {

    const etudiant = await Etudiant.create(validStudent);

    const res = await request(app)
      .get(`/api/etudiants/${etudiant._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nom).toBe('Dupont');
  });

  test('retourne 404 pour un ID inexistant', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .get(`/api/etudiants/${fakeId}`);

    expect(res.statusCode).toBe(404);
  });

  test('retourne 400 pour un ID invalide', async () => {
    const res = await request(app)
      .get('/api/etudiants/id-invalide');

    expect(res.statusCode).toBe(400);
  });

});


// ===============================
// PUT
// ===============================
describe('PUT /api/etudiants/:id', () => {

  test('met à jour un étudiant', async () => {

    const etudiant = await Etudiant.create(validStudent);

    const res = await request(app)
      .put(`/api/etudiants/${etudiant._id}`)
      .send({ moyenne: 17 });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.moyenne).toBe(17);
    expect(res.body.data.nom).toBe('Dupont');
  });

  test('retourne 404 si étudiant inexistant', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .put(`/api/etudiants/${fakeId}`)
      .send({ moyenne: 17 });

    expect(res.statusCode).toBe(404);
  });

});


// ===============================
// DELETE
// ===============================
describe('DELETE /api/etudiants/:id', () => {

  test('supprime l\'étudiant et retourne 200', async () => {

    const etudiant = await Etudiant.create(validStudent);

    const res = await request(app)
      .delete(`/api/etudiants/${etudiant._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(await Etudiant.findById(etudiant._id)).toBeNull();
  });

  test('retourne 404 si étudiant inexistant', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`/api/etudiants/${fakeId}`);

    expect(res.statusCode).toBe(404);
  });

});