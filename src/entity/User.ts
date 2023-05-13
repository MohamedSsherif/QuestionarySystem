import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany, JoinColumn, JoinTable, Unique } from "typeorm"
import { Course } from "./Course"

export enum UserType {ADMIN = "Admin" , STUDENT = "Student", DOCTOR = "Doctor"}

@Entity("User" ,)
export class User {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    password: string

    @Column()
    university_code: string

    @Column({unique:true})
    national_id: string

    @Column({unique:true})
    email: string

    @Column({
        type: "enum",
        enum: UserType,
        default: UserType.STUDENT,
    })
    type: UserType

    // @OneToMany(type => Course, (course)=> course.doctor)
    // @JoinTable({name:"course_id"})
    // doctorCourses: Course[];

    @ManyToMany(() => Course,(course)=> course.users)
    // @JoinTable({ name: "user_courses" })
    courses: Course[];

}

