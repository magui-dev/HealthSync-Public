package com.healthsync.project.post.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "tag")
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tag_id")
    private long id;

    @Column(name = "tag_data", length = 100, nullable = false)
    private String tagName;

    public Tag(String tagName) {
        this.tagName = tagName;
    }

    public static Tag createFreeTag(String tag) {
        return new Tag(tag);
    }

}
