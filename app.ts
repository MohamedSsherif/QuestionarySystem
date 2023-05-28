import * as express from "express"
import { Request, Response } from "express"
import { Brackets, DataSource } from "typeorm"
import { User, UserType } from "./src/entity/User"
import { Course } from "./src/entity/Course"
import { Questionary } from "./src/entity/Questionary"
import { Answer } from "./src/entity/Answer"
import * as bcrypt from 'bcrypt'
import { UserAnswer } from "./src/entity/UserAnswers"
import * as cors from "cors";


export enum AnswersType {OK = "موافق" , Not_OK = "غير موافق", MAYBE = "الي حد ما", EXACTLY= "موافق تماما"}


const myDataSource = new DataSource({
     type: "mysql",
   
    // type: "mysql",
    // host: "localhost",
    // username: "root",
    // password: "Me123456Do",
    // database: 'university',

    //database: 'university',


    host: 'sql7.freemysqlhosting.net',
    username: 'sql7621776',
    password: "bpgcUAWp6z",
    database: 'sql7621776',
    port : 3306,
    //connectionLimit : 1000,
    connectTimeout  : 20000,
    // acquireTimeout  : 60 * 60 * 1000,
    // timeout         : 60 * 60 * 1000,

    entities: [User,Course,Questionary , Answer , UserAnswer],
    logging: true,
    
    debug: false,
    
   
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

app.use(cors({
  origin: "*",
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ['GET, POST, PUT, DELETE'],
}));


app.post('/signIn',async (req,res)=>{
    // email , password , university code and national id are required 
   const query = await myDataSource.getRepository(User)

   let user = await query.findOne( {relations: {courses:true} , where:{national_id: req.body.national_id , university_code: req.body.university_code}})
   // let  userRes = await repo.findBy({NationalId: req.body.NationalId,})
   if(!user || user === undefined){
       return res.status(404).send('User not found')
   }

   const email: String = user.email
   if(email !== req.body.email, email.split('@')[1] !== "fcis.bsu.edu.eg"){
       return res.status(404).send('invalid email')
   }

//    const checkpassword = await bcrypt.compare(req.body.password,user.password)
   const checkpassword = req.body.password === user.password
   if(!checkpassword){
       return res.status(404).send('invalid password')
   }



   delete user.password
   res.json(user)
})

app.post("/user", async function (req: Request, res: Response) {
    // let hashedPass = await bcrypt.hash(req.body.password, 10,)
    // req.body.password = hashedPass
    const repo = myDataSource.getRepository(User)
    const user = repo.create( req.body as User)
    const results = await repo.save(user)
    return res.send(results)
})


app.get("/user", async function (req: Request, res: Response) {
    const repo = await myDataSource.getRepository(User)
    .findOne({relations:{courses:true} , where:{id:+req.query.id}})
    // const user = await repo.findOneBy({userID :req.query.id})
    return res.send(repo)
})

app.get("/getAllUser",async function (req: Request,res:Response){
   const repo = await myDataSource.getRepository(User)
   .createQueryBuilder("User")
   .getMany()
    return res.json(repo)
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
//     const repo = myDataSource.getRepository(UserAnswer)
   
    
//     // let answersLength = ress[1]
//     // const userAnswer = repo.create(req.body as UserAnswer)
//     const userAnswer = repo.create(req.body as [UserAnswer])
    
//     for (let index = 0; index < userAnswer.length; index++) {
//         const element = userAnswer[index];
//         // const ress = await repo.query(`select * from sql7619574.user_answer as ans left join sql7619574.user as user on user.id = ans.userId left join sql7619574.answer as answers on answers.id = ans.answerId where userId = ${element.user} and questionId = ${element.question} and courseId =${element.course};`)
//         const ress = await repo.query(`select * from university.user_answer as ans left join university.user as user on user.id = ans.userId left join university.answer as answers on answers.id = ans.answerId where userId = ${element.user} and questionId = ${element.question} and courseId =${element.course};`)
//         if(ress.length > 0){
//             return res.status(404).send('You have already answered this question : ' + element.question + ' in this course :  ' + element.course + ' with answer :  ' + element.answer)
//         }
//         const results = await repo.save(element)
        
//     }

//     // const results = await repo.insert(userAnswer)
//     return res.json('Done')
// })



app.post("/userAnswer", async function (req: Request, res: Response) {
    const repo = myDataSource.getRepository(UserAnswer)
   
    const ress = await repo.query(`select * from sql7619574.user_answer as ans left join sql7619574.user as user on user.id = ans.userId left join sql7619574.answer as answers on answers.id = ans.answerId where userId = ${req.body.user} and questionId = ${req.body.question} and courseId =${req.body.course};`)

    // let answersLength = ress[1]
    if(ress.length > 0){
        return res.status(404).send('You have already answered this question')
    }
    const userAnswer = repo.create(req.body as UserAnswer)



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
      
    })
    
    .getMany()
    

    const totalLength = repo.length

    const OK_Res = repo.filter((item) => item.answer.answer === AnswersType.OK).length/totalLength
    const Tmam_Res = repo.filter((item) => item.answer.answer === AnswersType.Not_OK).length/totalLength
    const yes_res = repo.filter((item) => item.answer.answer === AnswersType.MAYBE).length/totalLength
    const no_res = repo.filter((item) => item.answer.answer === AnswersType.EXACTLY).length/totalLength

    // const results = repo.length
    const results = {"ok" : OK_Res , "tmam" : Tmam_Res , "yes" : yes_res , "no" : no_res}
    return res.json(results)
})

app.get("/Answer", async function (req: Request, res: Response) {
    const repo = await myDataSource.getRepository(Answer)
    .createQueryBuilder("answer")
    .getMany()
    return res.json(repo)
})

app.get("/question", async function (req: Request, res: Response) {
    const repo = await myDataSource.getRepository(Questionary)
    .createQueryBuilder("question")

    .getMany()
    return res.json(repo)
})

app.get("/allCourses", async function (req: Request, res: Response) {
    const repo = await myDataSource.getRepository(Course)
    .createQueryBuilder("course")
   // .leftJoinAndSelect("course.users", "user")
    .getMany()
    return res.json(repo)
})


app.get("/percentage", async function (req: Request, res: Response) {
   
  const questionRepo: any = await myDataSource.getRepository(Questionary)
  .createQueryBuilder("question")
  .leftJoinAndMapMany('question.answer', UserAnswer, 'ans', 'ans.question.id = question.id')
  
  .leftJoinAndSelect('ans.answer', 'ans2')
  
  .where("ans.courseId = :id", { id: req.query.courseId })
  .getMany()
  
      const statiscs = questionRepo.map((item: any) => {
          
          let ans = item.answer
          let totalAns = ans.length
  
          let ok = 0
          let notOk = 0
          let maybe = 0
          let Exactly = 0
  
           ans.filter((item: any) => {
              if(item.answer.answer === AnswersType.OK){
                  ++ok
              }else if(item.answer.answer === AnswersType.Not_OK){
                  ++notOk
              }else if(item.answer.answer === AnswersType.MAYBE){
                  ++maybe
              }else if(item.answer.answer === AnswersType.EXACTLY){
                  ++Exactly
              }
           })
          return {
              question: item.question,
              answers:{
                  "موافق": (ok/totalAns),
                  "غير موافق": (notOk/totalAns),
                  "الي حد ما": (maybe/totalAns),
                  "موافق تماما": (Exactly/totalAns),
              } 
          }
      })
    
      return res.json(statiscs)
  })

app.get("/allUserAnswer", async function (req: Request, res: Response) {
    const repo = myDataSource.getRepository(UserAnswer)
    .createQueryBuilder("userAnswer")
    .leftJoinAndSelect("userAnswer.question", "question")
    .leftJoinAndSelect("userAnswer.user", "user",)
    .leftJoinAndSelect("userAnswer.course", "course",)
    .leftJoinAndSelect("userAnswer.answer", "answer",)
   
    

    const results = await repo.getMany()
    return res.json(results)
})



app.delete("/users/:id", async function (req: Request, res: Response) {
    const results = await myDataSource.getRepository(User).delete(req.params.id)
    return res.send(results)
})

app.delete("/course", async function (req: Request, res: Response) {
    const results = await myDataSource.getRepository(Course).delete(req.body)
    return res.send(results)
})

// start express server
app.listen(3000)