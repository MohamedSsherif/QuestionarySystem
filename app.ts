import * as express from "express"
import { Request, Response } from "express"
import { Brackets, DataSource } from "typeorm"
import { User, UserType } from "./src/entity/User"
import { Course } from "./src/entity/Course"
import { Questionary } from "./src/entity/Questionary"
import { Answer } from "./src/entity/Answer"
import * as bcrypt from 'bcrypt'
import { UserAnswer } from "./src/entity/UserAnswers"


const myDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    username: "root",
    password: "Me123456Do",
    database: 'university',
    entities: [User,Course,Questionary , Answer , UserAnswer],
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
        onAppBootstrap()
    })
    .catch((err) => {
        console.error("Error during Data Source initialization:", err)
    })

// create and setup express app
const app = express()
app.use(express.json())

async function onAppBootstrap() {
    const user1 = new User()
    
    // user.email = "sa@asd.com"
    const ds = myDataSource.getRepository(User)
    if(!ds.findOneBy({id:1})){
        const userRepo = ds.create([user1])
        await ds.save(userRepo)
    }

    const question1 = new Questionary()
    const ds1 = myDataSource.getRepository(Questionary)
    if(!ds1.findOneBy({id:1})){
        const userRepo = ds1.create([question1])
        await ds1.save(userRepo)
    }

    const answer1 = new Answer()
    const answerDs = myDataSource.getRepository(Answer)
    if(!answerDs.findOneBy({id:1})){
        const userRepo = ds1.create([answer1])
        await ds1.save(userRepo)
    }

    const course = new Course()
    course.users = [user1]
    const courseDs = myDataSource.getRepository(Course)
    if(!courseDs.findOneBy({id:1})){
        const userRepo = ds1.create([course])
        await ds1.save(userRepo)
    }




}


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
    const repo =  myDataSource.getRepository(Answer)
    const answer =  repo.create(req.body)
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

// app.post("/userAnswer", async function (req: Request, res: Response) {
//     const userAnswersrepo =  myDataSource.getRepository(UserAnswer)
//     const userAnswer = userAnswersrepo.create(req.body as UserAnswer)
        
    
//     const finalAns = await userAnswersrepo.save(userAnswer)
//    // const userAnswerRes = await userAnswersrepo.findOne( {relations: {user:true , course:true , question:true , answer: true , } , where:{id: finalAns.id }})
//     const userAnswerRes = await userAnswersrepo.findOne( {relations: { question:true , answer: true , } , where:{id: finalAns.id }})
//     return res.json(userAnswerRes)
// })

app.post("/userAnswer", async function (req: Request, res: Response) {
    const repo = myDataSource.getRepository(UserAnswer)
   
    const ress = await repo.query(`select * from university.user_answer as ans left join user as user on user.id = ans.userId left join answer as answers on answers.id = ans.answerId where userId = ${req.body.user} and questionId = ${req.body.question};`)

    
    
    // let answersLength = ress[1]
    if(ress.length > 0){
        return res.status(404).send('You have already answered this question')
    }
    const userAnswer = repo.create(req.body as UserAnswer)



    // .leftJoinAndSelect("userAnswer.course", "course",)
    // .select(["questionary.id","questionary.question","answers.answer","user.name" , "user.id"])
    // .where("question.id = :id", { id: req.body.questionId })
   
    // userAnswer.question = data.question
    // userAnswer.answer = data.answer
    // userAnswer.user = data.user
    // userAnswer.course = data.course
    

    const results = await repo.save(userAnswer)
    return res.json(results)
})

app.get("/questionAnswerCount", async function (req: Request, res: Response) {
    const repo = await myDataSource.getRepository(UserAnswer)
    // .find( { where:{question: req.body.question }})
    .createQueryBuilder("userAnswer")
    .leftJoinAndSelect("userAnswer.question", "question")
    .leftJoinAndSelect("userAnswer.answer", "answer")
    
    .where({
        question: {
            id: req.body.question
        },
        // answer: {
        //     id: req.body.answer
        // }
    })
    // .where("question.id = :id", { id: req.body.question })
    // .addSelect('COUNT(answer.id) FILTER (WHERE answer.answer = 'tmam')', 'tmam_answer')
    .getMany()
    // .leftJoinAndSelect("userAnswer.answer", "answer",)
    // .andWhere("question.answer.id = :id", { id: this.answe.id })

    // const answers = await repo
    // .leftJoinAndSelect("userAnswer.answer", "answer",)
    // .where("answer.id = :id", {id:"question.id" })
    // .getMany()
    // .find( {relations: { answer: true}, where:{question: req.body.question}})

    const totalLength = repo.length

    const OK_Res = repo.filter((item) => item.answer.answer === "ok").length/totalLength
    const Tmam_Res = repo.filter((item) => item.answer.answer === "tmam").length/totalLength
    const yes_res = repo.filter((item) => item.answer.answer === "yes").length/totalLength

    // const results = repo.length
    const results = {"ok" : OK_Res , "tmam" : Tmam_Res , "yes" : yes_res}
    return res.json(results)
})



app.get("/percentage", async function (req: Request, res: Response) {
    const userAnswerRepo = await myDataSource.getRepository(UserAnswer)
    .createQueryBuilder("userAnswer")
    .leftJoinAndSelect('Questionary', 'question', 'question.id = userAnswer.question.id')
    .getMany()

    const questionRepo = await myDataSource.getRepository(Questionary)
    .createQueryBuilder("question")
    .leftJoinAndMapMany('question.answers', UserAnswer, 'ans', 'ans.question.id = question.id')
    .leftJoinAndSelect('ans.answer', 'ans2')
    .getCount()
    


    const totalQuestionAnswersLength = questionRepo



    // .leftJoinAndMapMany('post.follow', Follow, 'follow', 'follow.userId = user.id')
    // .where(new Brackets(qb => {
    //       qb.where('ans.publicScope = :follower', { follower: 'Follower' })
    //         .andWhere('post.userId = follow.followeeId')
    //         .andWhere(':myId = follow.userId', { myId: user.id })
    // }))
    // .getMany()
    
    // .createQueryBuilder("question")
    // .leftJoinAndSelect("userAnswer.question", "question")
    // .getMany()
    // .findAndCount( {relations: {user:true , course:true , answer: true}, where:{question: req.body.question }})
    // .count( { where:{question: req.body.question }})
    // .createQueryBuilder("userAnswer")
    // .leftJoinAndSelect("userAnswer.question", "question")
    // .leftJoinAndSelect("userAnswer.user", "user",)
    // .leftJoinAndSelect("userAnswer.course", "course",)
    // .leftJoinAndSelect("userAnswer.answer", "answer",)
    // // .select(["questionary.id","questionary.question","answers.answer","user.name" , "user.id"])
    // .where("question.id = :id", { id: req.body.question })
    // .andWhere("user.id = :id", { id: req.body.user })
    // .andWhere("course.id = :id", { id: req.body.course })
    // .andWhere("answer.id = :id", { id: req.body.answer })
    
    // userAnswer.question = data.question
    // userAnswer.answer = data.answer
    // userAnswer.user = data.user
    // userAnswer.course = data.course
    

    const results = questionRepo
    return res.json(results)
})

app.get("/allUserAnswer", async function (req: Request, res: Response) {
    const repo = myDataSource.getRepository(UserAnswer)
    .createQueryBuilder("userAnswer")
    .leftJoinAndSelect("userAnswer.question", "question")
    .leftJoinAndSelect("userAnswer.user", "user",)
    .leftJoinAndSelect("userAnswer.course", "course",)
    .leftJoinAndSelect("userAnswer.answer", "answer",)
    // .select(["questionary.id","questionary.question","answers.answer","user.name" , "user.id"])
    
    // userAnswer.question = data.question
    // userAnswer.answer = data.answer
    // userAnswer.user = data.user
    // userAnswer.course = data.course
    

    const results = await repo.getMany()
    return res.json(results)
})



app.delete("/users/:id", async function (req: Request, res: Response) {
    const results = await myDataSource.getRepository(User).delete(req.params.id)
    return res.send(results)
})

// start express server
app.listen(3000)


