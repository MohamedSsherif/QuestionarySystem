import * as express from "express"
import { Request, Response } from "express"
import { DataSource } from "typeorm"
import { User, UserType } from "./src/entity/User"
import { Course } from "./src/entity/Course"
import { Questionary } from "./src/entity/Questionary"
import { QuestionaryAnswers } from "./src/entity/QuestionaryAnswers"
import * as bcrypt from 'bcrypt'


const myDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    username: "root",
    password: "Me123456Do",
    database: 'university',
    entities: [User,Course,Questionary , QuestionaryAnswers],
    logging: true,
    // debug: true,
    // synchronize: true,
    // dropSchema:true
})

// establish database connection
myDataSource
    .initialize()
    .then(() => {
        console.log("Data Source has been initialized!")
    })
    .catch((err) => {
        console.error("Error during Data Source initialization:", err)
    })

// create and setup express app
const app = express()
app.use(express.json())


app.post('/signIn',async (req,res)=>{
    const query = await myDataSource.getRepository(User)

    let user = await query.findOne( {relations: {courses:true} , where:{national_id: req.body.national_id }})
    // let  userRes = await repo.findBy({NationalId: req.body.NationalId,})
    if(!user || user === undefined){
        return res.status(404).send('User not found')
    }

    const checkpassword = await bcrypt.compare(req.body.password,user.password)
    if(!checkpassword){
        return res.status(404).send('invalid nationalId or password')
    }

    //var request = new sql.Request();
    // request.query('select password from users', function (err, records) {
    //     if (err) console.log(err)
    //     res.send(records);
    // });

    delete user.password
    res.json(user)
})

app.post("/user", async function (req: Request, res: Response) {
    let hashedPass = await bcrypt.hash(req.body.password, 10,)
    req.body.password = hashedPass
    const repo = myDataSource.getRepository(User)
    const user = repo.create( req.body as User)
    const results = await repo.save(user)
    return res.send(results)
})


app.get("/user", async function (req: Request, res: Response) {
    const repo = await myDataSource.getRepository(User)
    .findOne({relations:{courses:true} , where:{id:req.query.id}})
    // const user = await repo.findOneBy({userID :req.query.id})
    return res.send(repo)
})

app.post("/addCouseUsers", async function (req: Request, res: Response) {
    const repo = myDataSource.getRepository(Course)
    const cousre = await repo.findOneBy({id: req.body.id})
    const users = await myDataSource.getRepository(User)
        .createQueryBuilder("user")
        .whereInIds(req.body.users)
        .getMany()
    cousre.users = users

    const results = await repo.save(cousre)
    // const user = await repo.findOneBy({userID :req.query.id})
    return res.json(results)
})

app.get("/getCourseStudents", async function (req: Request, res: Response) {
    const repo = myDataSource.getRepository(Course)
    .createQueryBuilder("course")
    .leftJoinAndSelect("course.users", "users")
    .where("course.id = :id", { id: req.query.course_id })
    
    if(req.query.userType !== undefined){
        repo.andWhere("users.type = :type", { type: req.query.userType })
    }

    const results = await repo.getOne()
    return res.json(results)
})



app.post("/questionary", async function (req: Request, res: Response) {
    const repo =  myDataSource.getRepository(Questionary)
    const user =  repo.create(req.body)
    const results = await repo.save(user)
    return res.send(results)
})

app.post("/answer", async function (req: Request, res: Response) {
    const repo = await myDataSource.getRepository(QuestionaryAnswers)
    const answer = await repo.create(req.body)
    const results = await repo.save(answer)
    return res.send(results)
})

app.post("/course", async function (req: Request, res: Response) {
    const repo = await myDataSource.getRepository(Course)
    const course = await repo.create(req.body as Course)

    const users = await myDataSource.getRepository(User)
        .createQueryBuilder("user")
        .whereInIds(req.body.users)
        .getMany()

    course.users = users
    const results = await repo.save(course)
    return res.send(results)
})

app.get("/questionAnswers", async function (req: Request, res: Response) {
    const repo = myDataSource.getRepository(Questionary)
    .createQueryBuilder("questionary")
    .leftJoinAndSelect("questionary.answers", "answers")
    .leftJoinAndSelect("answers.user", "user",)
    .select(["questionary.id","questionary.question","answers.answer","user.name" , "user.id"])
    .where("questionary.id = :id", { id: req.query.quest_id })
    .andWhere("user.type = 'Student'")
    

    const results = await repo.getOne()
    return res.json(results)
})



app.delete("/users/:id", async function (req: Request, res: Response) {
    const results = await myDataSource.getRepository(User).delete(req.params.id)
    return res.send(results)
})

// start express server
app.listen(3000)