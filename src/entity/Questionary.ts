import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Course } from "./Course";
import { QuestionaryAnswers } from "./QuestionaryAnswers";

@Entity()
export class Questionary {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    question: string;

    // @Column()
    // answer: string;

    // @Column()
    // answer_id: number;

    @OneToMany(type => QuestionaryAnswers, (question)=> question.questionary)
    answers: QuestionaryAnswers[];

}