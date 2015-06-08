/**
 * Created by taox on 15-4-29.
 */
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['app/js/*.js'],
        dest: 'app/dist/<%= pkg.name %>.js'
      }
    },
    jsdoc : {
      dist : {
        src: ['app/js/*.js'],
        options: {
          destination: 'app/doc'
        }
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      dist: {
        files: {
          'app/dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    bower: {
      install: {
        options: {
          targetDir: './app/lib',
          layout: 'byType',
          install: true,
          verbose: false,
          cleanTargetDir: false,
          cleanBowerDir: false,
          bowerOptions: {}
        }
      }
    }
  });

  // 加载包含 "uglify" 任务的插件。
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.loadNpmTasks('grunt-bower-task');
  // 默认被执行的任务列表。
  grunt.registerTask('default', ['concat','uglify','jsdoc','bower']);

};