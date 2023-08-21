import { Injectable } from "@angular/core";
import { Course } from "../model/course";
import { Observable, Subject, BehaviorSubject } from "rxjs";
import { createHttpObservable } from "./util";
import { filter, map, shareReplay, tap } from "rxjs/operators";
import { fromPromise } from "rxjs/internal-compatibility";

@Injectable({
    providedIn: 'root'
})
export class Store {
    private subject = new BehaviorSubject<Course[]>([]);

    courses$: Observable<Course[]> = this.subject.asObservable();

    init() {
        const http$ = createHttpObservable('/api/courses');

        http$
            .pipe(
                tap(() => console.log("HTTP request executed")),
                map(res => Object.values(res["payload"])),
            )
            .subscribe(
                courses => this.subject.next(courses)
            );
    }

    selectBeginnerCourses() {
        return this.filterByCategory('BEGINNER');
    }

    selectAdvancedCourses() {
        return this.filterByCategory('ADVANCED');
    }

    selectCourseById(courseId: number) {
        return this.courses$
        .pipe(
            map(courses => courses
                .find(course => course.id == courseId)),
                filter(course => !!course)
        );
    }

    filterByCategory(category: string) {
        return this.courses$
        .pipe(
            map(courses => courses
                .filter(course => course.category == category))
        );
    }

    saveCourse(courseId: number, changes): Observable<any> {
        const courses = this.subject.getValue();

        const courseIndex = courses.findIndex(course => course.id == courseId);

        const newCourse = courses.slice(0);

        newCourse[courseIndex] = {
            ...courses[courseIndex],
            ...changes
        };

        this.subject.next(newCourse);

        return fromPromise(fetch(`/api/courses/${courseId}`, {
            method: 'PUT',
            body: JSON.stringify(changes),
            headers: {
                'content-type': 'application/json'
            }
        }));
    }
}