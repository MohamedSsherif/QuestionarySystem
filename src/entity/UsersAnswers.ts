import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Questionary } from "./Questionary";
import { User } from "./User";

@Entity()
export class UsersAnswers  {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    answer: string;

    @Column()
    answered_by_id: number;

    @Column()
    percentage: number;

    @ManyToOne(type => Questionary , quest => quest.answers, {
        nullable: false,
        
    })
    @JoinColumn()
    questionary: Questionary;
    
    @OneToOne(type => User, {
        nullable: false,
    })
    @JoinColumn()
    user: User;
}