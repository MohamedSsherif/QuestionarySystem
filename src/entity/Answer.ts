import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Questionary } from "./Questionary";
import { User } from "./User";

@Entity()
export class Answer {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({default:"answer"})
    answer: string;

    // @ManyToOne(type => Questionary , quest => quest.answers, {
    //     nullable: false,
        
    // })
    // @JoinColumn()
    // questionary: Questionary;
    
    // @OneToOne(type => User, {
    //     nullable: false,
    // })
    // @JoinColumn()
    // user: User;

    

    
}